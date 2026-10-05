/**
 * Safe publication of archive objects.
 *
 * Three properties matter more than throughput here:
 *
 *  1. **Atomicity.** An artifact is served the moment it is published, and a
 *     client may request it mid-write. Every write lands in a temp file in the
 *     same directory, is fsynced, then `rename`d — a reader sees the whole
 *     object or nothing, never a truncated one.
 *
 *  2. **Immutability of published builds.** Keys under a build prefix are
 *     content-addressed by the build id and must never change: a client that
 *     already resolved `…/<buildId>/Minerva.msix` would otherwise pull
 *     different bytes than the manifest it validated. An existing key is
 *     therefore never overwritten. The one deliberate exception is a channel
 *     record, which is a mutable pointer by design — and that is the only
 *     mutable object in the archive.
 *
 *  3. **Containment.** The key grammar already forbids traversal; the resolved
 *     path is re-checked against the root anyway, because this writes to disk
 *     with a request-supplied name.
 */

import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, open, rename, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export class WriteError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

/** The archive's only mutable object: the per-channel head pointer. */
export function isMutableKey(key: string): boolean {
  return /^releases\/channels\/[A-Za-z0-9_-]+\.json$/.test(key);
}

/**
 * A precondition on a write, mirroring S3 semantics so the publisher's
 * compare-and-swap loop keeps working against this origin unchanged:
 *   `{kind:"absent"}`   create only; an existing key is a 412
 *   `{kind:"ifMatch"}`  replace only if the current ETag is exactly this
 */
export type WriteCondition = { kind: "absent" } | { kind: "ifMatch"; etag: string };

export interface PublishResult {
  key: string;
  size: number;
  sha256: string;
  /** True when the key already held this exact content (a retried publish). */
  unchanged: boolean;
  /** True when the key did not exist before this write. */
  created: boolean;
}

export interface PublishOptions {
  /** Upper bound on a single object. MSIX bundles are large; JSON is not. */
  maxBytes: number;
  /** Absent means "no precondition", which is only safe for a fresh key. */
  condition?: WriteCondition;
}

/** Current ETag of a stored object, or null when the key is absent. */
async function currentEtag(target: string): Promise<string | null> {
  const info = await stat(target).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!info) return null;
  return `W/"${info.size.toString(16)}-${info.mtimeMs.toString(16)}"`;
}

/**
 * Enforce the precondition BEFORE staging any bytes. Failing after the upload
 * would still be correct (rename is last) but would burn a large transfer on a
 * write that was already doomed.
 */
async function checkCondition(target: string, condition: WriteCondition | undefined): Promise<void> {
  if (!condition) return;
  const etag = await currentEtag(target);
  if (condition.kind === "absent") {
    if (etag !== null) throw new WriteError("precondition failed: the object already exists", 412);
    return;
  }
  if (etag === null) throw new WriteError("precondition failed: the object does not exist", 412);
  if (etag !== condition.etag) {
    throw new WriteError("precondition failed: the object changed", 412);
  }
}

export async function publishObject(
  root: string,
  key: string,
  body: ReadableStream<Uint8Array>,
  options: PublishOptions
): Promise<PublishResult> {
  const base = path.resolve(root);
  const target = path.resolve(base, key);
  if (target !== base && !target.startsWith(base + path.sep)) {
    throw new WriteError("resolved key escaped the storage root", 400);
  }

  await checkCondition(target, options.condition);

  const existing = await stat(target).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });

  const directory = path.dirname(target);
  await mkdir(directory, { recursive: true });

  // Stage under a name no reader can address, then swap. The temporary carries
  // the pid so two concurrent publishes cannot collide on it.
  const temporary = path.join(directory, `.upload-${process.pid}-${randomSuffix()}`);

  try {
    const hash = createHash("sha256");
    let size = 0;
    const source = Readable.fromWeb(body as Parameters<typeof Readable.fromWeb>[0]);

    source.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > options.maxBytes) {
        source.destroy(new WriteError("object exceeds the publish size limit", 413));
        return;
      }
      hash.update(chunk);
    });

    await pipeline(source, createWriteStream(temporary, { flags: "wx", mode: 0o644 }));
    const digest = hash.digest("hex");

    // Durability before the rename: a client that can see the key must be able
    // to read it after a crash, not discover a zero-length file. Opened r+ and
    // not r because Windows rejects fsync on a read-only handle (EPERM).
    const handle = await open(temporary, "r+");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }

    if (existing) {
      // Immutable prefix: identical content is a no-op, different content is a
      // refusal. Either way the published bytes never change.
      if (!isMutableKey(key)) {
        const prior = await sha256Of(target);
        if (prior === digest) return { key, size, sha256: digest, unchanged: true, created: false };
        throw new WriteError(
          `refusing to overwrite a published immutable object: ${key}`,
          409
        );
      }
    }

    await rename(temporary, target);
    return { key, size, sha256: digest, unchanged: false, created: existing === null };
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    if (error instanceof WriteError) throw error;
    throw new WriteError(`publish failed: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
}

async function sha256Of(file: string): Promise<string> {
  const hash = createHash("sha256");
  const handle = await open(file, "r");
  try {
    const stream = handle.createReadStream();
    for await (const chunk of stream) hash.update(chunk as Buffer);
  } finally {
    await handle.close();
  }
  return hash.digest("hex");
}

function randomSuffix(): string {
  return createHash("sha256").update(`${Date.now()}:${Math.random()}`).digest("hex").slice(0, 12);
}
