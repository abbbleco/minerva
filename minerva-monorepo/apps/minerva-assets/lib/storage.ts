/**
 * Read-only object access for the release archive.
 *
 * Two drivers, chosen by env, because the deployment shapes differ:
 *
 *   MINERVA_ASSETS_BUCKET_URL  an already-public HTTPS bucket (R2 public bucket,
 *                              a CDN in front of one). Objects are fetched over
 *                              plain HTTPS, so there is no SDK and no
 *                              credentials in this app.
 *   MINERVA_ASSETS_ROOT         a directory tree (a VM with the artifacts on a
 *                              mounted volume, or a local rehearsal).
 *
 * Exactly one must be set. There is no implicit third source and no default: an
 * origin that cannot say where its bytes come from must fail at boot rather
 * than serve a plausible-looking empty channel.
 *
 * This app NEVER writes. Publishing is a separate, credentialed step
 * (`hermes_cli/release_channels.py` + `scripts/releases/r2.py` in the product
 * repo) — keeping the two apart is what lets the origin be a plain public
 * web server with no write credentials at all.
 */

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

export interface StoredObject {
  body: ReadableStream<Uint8Array> | null;
  size: number;
  contentType: string;
  /** Weak validator the client may re-check with a conditional request. */
  etag: string | undefined;
  lastModified: string | undefined;
}

export interface Storage {
  readonly name: string;
  /** Resolve an object, or null when the key is absent. Throws on transport failure. */
  get(key: string, method: "GET" | "HEAD"): Promise<StoredObject | null>;
}

/** Extensions the protocol addresses; anything else is served as a byte stream. */
const CONTENT_TYPES: Record<string, string> = {
  json: "application/json",
  appinstaller: "application/octet-stream",
  msix: "application/octet-stream",
  msixbundle: "application/octet-stream",
  exe: "application/octet-stream",
  yml: "text/yaml; charset=utf-8",
  yaml: "text/yaml; charset=utf-8",
  zip: "application/zip",
  dmg: "application/octet-stream",
  html: "text/html; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  sig: "application/octet-stream",
};

export function contentTypeFor(key: string): string {
  return CONTENT_TYPES[path.extname(key).slice(1).toLowerCase()] ?? "application/octet-stream";
}

function bucketDriver(base: string): Storage {
  const root = base.replace(/\/+$/, "");

  return {
    name: `bucket:${root}`,
    async get(key, method) {
      // The key has already passed the protocol grammar, which admits no
      // traversal segment; encoding each segment individually keeps the URL
      // unambiguous without ever producing one from unvalidated input.
      const target = `${root}/${key.split("/").map(encodeURIComponent).join("/")}`;
      const response = await fetch(target, {
        method,
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
        cache: "no-store",
      });

      if (response.status === 404 || response.status === 403) return null;
      if (!response.ok) {
        throw new Error(`object store returned HTTP ${response.status} for ${key}`);
      }

      const length = response.headers.get("content-length");
      return {
        // A HEAD has no body; the caller still learns the size from headers.
        body: method === "HEAD" || !response.body ? null : response.body,
        size: length === null ? 0 : Number(length),
        contentType: response.headers.get("content-type") ?? contentTypeFor(key),
        etag: response.headers.get("etag") ?? undefined,
        lastModified: response.headers.get("last-modified") ?? undefined,
      };
    },
  };
}

function filesystemDriver(root: string): Storage {
  const base = path.resolve(root);

  return {
    name: `fs:${base}`,
    async get(key, method) {
      // Containment is re-checked after resolution: the protocol grammar already
      // forbids `.`/`..` segments, and this refuses to rely on that alone.
      const target = path.resolve(base, key);
      if (target !== base && !target.startsWith(base + path.sep)) {
        throw new Error("resolved object escaped the storage root");
      }

      let info;
      try {
        info = await stat(target);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
      }
      if (!info.isFile()) return null;

      const stream = method === "HEAD" ? null : Readable.toWeb(createReadStream(target)) as ReadableStream<Uint8Array>;
      return {
        body: stream,
        size: info.size,
        contentType: contentTypeFor(key),
        etag: `W/"${info.size.toString(16)}-${info.mtimeMs.toString(16)}"`,
        lastModified: new Date(info.mtimeMs).toUTCString(),
      };
    },
  };
}

export function createStorage(): Storage {
  const bucket = process.env.MINERVA_ASSETS_BUCKET_URL?.trim();
  const root = process.env.MINERVA_ASSETS_ROOT?.trim();

  if (bucket && root) {
    throw new Error("Set one of MINERVA_ASSETS_BUCKET_URL or MINERVA_ASSETS_ROOT, not both");
  }
  if (bucket) {
    if (!/^https:\/\//.test(bucket)) {
      throw new Error("MINERVA_ASSETS_BUCKET_URL must be https");
    }
    return bucketDriver(bucket);
  }
  if (root) return filesystemDriver(root);

  throw new Error(
    "No object source configured. Set MINERVA_ASSETS_BUCKET_URL (public bucket) or MINERVA_ASSETS_ROOT (directory)."
  );
}
