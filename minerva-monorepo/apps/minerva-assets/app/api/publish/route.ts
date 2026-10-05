import { NextResponse } from "next/server";

import { authorizePublish } from "@/lib/auth";
import {
  artifactKey,
  channelRecordKey,
  ProtocolError,
  validateChannelManifest,
  validateChannelRecord,
} from "@/lib/protocol";
import { publishObject, WriteError, type WriteCondition } from "@/lib/writer";

export const dynamic = "force-dynamic";

/**
 * POST /api/publish — the write side of the release origin.
 *
 *   Authorization: Bearer <MINERVA_ASSETS_PUBLISH_TOKEN>, compared in constant
 *   time. Unset token means no publish path at all (503), never an open one.
 *
 *   Key: `?key=<object key>`, validated against the protocol grammar. The
 *   caller cannot choose an arbitrary destination.
 *
 *   Validation before storage: channel records and build manifests are decoded
 *   and checked against the protocol BEFORE they are written. This is the whole
 *   reason the origin holds the validator — a malformed record published by a
 *   broken pipeline would otherwise be served to every installed client, which
 *   has no fallback for it and would take the channel offline fleet-wide. Here
 *   it is a 422 on the publisher instead.
 *
 *   Immutability: a key under a build prefix is never overwritten once written.
 *   Republishing identical bytes is a no-op; different bytes are a 409.
 *   Channel records are the one mutable object and are replaced in place.
 *
 * Requires MINERVA_ASSETS_ROOT: a bucket-backed origin has no local filesystem
 * to write into, and silently accepting a publish it cannot durably store would
 * report success for an update nobody can fetch.
 */

/** An MSIX bundle is a few hundred MB; the cap leaves headroom, not slack. */
const MAX_ARTIFACT_BYTES = 4 * 1024 * 1024 * 1024;
/** Records and manifests are small JSON; anything larger is a mistake. */
const MAX_METADATA_BYTES = 1024 * 1024;

/**
 * Translate the HTTP precondition headers into the writer's condition.
 *
 * S3 semantics, because the publisher's compare-and-swap loop depends on them
 * and must not need a second code path against this origin:
 *   If-None-Match: *   create only          -> 412 when the key exists
 *   If-Match: <etag>   replace that exact one -> 412 when it changed
 *
 * Returns 400 for a header this origin cannot honour rather than ignoring it:
 * silently dropping a precondition would turn the publisher's CAS into a blind
 * overwrite of the channel head.
 */
function readCondition(request: Request): WriteCondition | undefined {
  const ifNoneMatch = request.headers.get("if-none-match");
  const ifMatch = request.headers.get("if-match");

  if (ifNoneMatch !== null && ifMatch !== null) {
    throw new WriteError("If-Match and If-None-Match are mutually exclusive", 400);
  }
  if (ifNoneMatch !== null) {
    if (ifNoneMatch.trim() !== "*") {
      throw new WriteError("only If-None-Match: * is supported", 400);
    }
    return { kind: "absent" };
  }
  if (ifMatch !== null) {
    const etag = ifMatch.trim();
    if (!etag || etag === "*" || etag.includes(",")) {
      throw new WriteError("If-Match requires exactly one entity tag", 400);
    }
    return { kind: "ifMatch", etag };
  }
  return undefined;
}

export async function POST(request: Request) {
  const auth = authorizePublish(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const root = process.env.MINERVA_ASSETS_ROOT?.trim();
  if (!root) {
    return NextResponse.json(
      { error: "this origin has no writable object store (MINERVA_ASSETS_ROOT unset)" },
      { status: 503 }
    );
  }

  let condition: WriteCondition | undefined;
  try {
    condition = readCondition(request);
  } catch (error) {
    return NextResponse.json({ error: messageOf(error) }, { status: error instanceof WriteError ? error.status : 400 });
  }

  const key = new URL(request.url).searchParams.get("key")?.trim();
  if (!key) {
    return NextResponse.json({ error: "publish requires a ?key=" }, { status: 400 });
  }

  let resolved: string;
  let isRecord: boolean;
  let isManifest: boolean;
  try {
    resolved = artifactKey(key);
    isRecord = /^releases\/channels\/[A-Za-z0-9_-]+\.json$/.test(resolved);
    // Cross-check the record shape so a record is also a legal object key.
    if (isRecord) channelRecordKey(resolved.slice("releases/channels/".length, -".json".length));
    isManifest = /^releases\/channel-builds\/[a-f0-9]{32}\/build\.json$/.test(resolved);
  } catch (error) {
    return NextResponse.json({ error: messageOf(error) }, { status: 400 });
  }

  const metadata = isRecord || isManifest;
  const maxBytes = metadata ? MAX_METADATA_BYTES : MAX_ARTIFACT_BYTES;

  const incoming = request.body;
  if (!incoming) {
    return NextResponse.json({ error: "publish requires a request body" }, { status: 400 });
  }
  const declared = request.headers.get("content-length");
  if (declared !== null && Number(declared) > maxBytes) {
    return NextResponse.json({ error: "declared body exceeds the size limit" }, { status: 413 });
  }

  // Artifacts stream straight through: an MSIX bundle must never be buffered
  // by the origin that exists to route it.
  if (!metadata) {
    return store(root, resolved, incoming, maxBytes, condition);
  }

  // Metadata is buffered because it must be parsed and validated BEFORE any of
  // it reaches the disk.
  const buffered = await bufferBody(incoming, maxBytes);
  if (buffered === null) {
    return NextResponse.json({ error: "metadata exceeds the size limit" }, { status: 413 });
  }

  let document: unknown;
  try {
    document = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(buffered));
  } catch {
    return NextResponse.json({ error: "metadata is not valid UTF-8 JSON" }, { status: 422 });
  }
  try {
    if (isRecord) validateChannelRecord(document);
    else validateChannelManifest(document);
  } catch (error) {
    const detail = error instanceof ProtocolError ? error.message : "unknown validation failure";
    return NextResponse.json({ error: "metadata failed protocol validation", detail }, { status: 422 });
  }

  return store(root, resolved, singleChunk(buffered), maxBytes, condition);
}

async function store(
  root: string,
  key: string,
  body: ReadableStream<Uint8Array>,
  maxBytes: number,
  condition?: WriteCondition
): Promise<NextResponse> {
  try {
    const result = await publishObject(root, key, body, { maxBytes, condition });
    // 201 only when the key was genuinely new; a replacement is a 200, so a
    // publisher can tell "I created this head" from "I moved it".
    const status = result.created ? 201 : 200;
    return NextResponse.json(result, { status });
  } catch (error) {
    if (error instanceof WriteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[minerva-assets] publish failed", error);
    return NextResponse.json({ error: "publish failed" }, { status: 500 });
  }
}

async function bufferBody(
  body: ReadableStream<Uint8Array>,
  limit: number
): Promise<Uint8Array | null> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

function singleChunk(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
