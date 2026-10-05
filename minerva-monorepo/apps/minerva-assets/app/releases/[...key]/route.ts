import { NextResponse } from "next/server";

import { artifactKey, ProtocolError, validateChannelManifest } from "@/lib/protocol";
import { createStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * GET|HEAD /releases/<key> — build manifests, feed descriptors and artifacts.
 *
 * The whole release archive shares one addressing scheme, so one route serves
 * all of it. What differs is how much the origin insists:
 *
 *   releases/channel-builds/<buildId>/build.json   validated as a manifest
 *   releases/channels/<name>.json                 handled by the sibling route
 *   everything else                               streamed through untouched
 *
 * Artifacts are streamed, never buffered: an MSIX bundle is hundreds of
 * megabytes and this process must stay a router in front of the bytes, not a
 * cache that happens to hold them.
 */
async function handle(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: segments } = await params;
  // A catch-all param covers only what follows its static parent, so `releases`
  // is not in `segments` and has to be put back to form the object key.
  const key = artifactKey(["releases", ...segments].join("/"));

  const storage = createStorage();

  let object;
  try {
    object = await storage.get(key, request.method === "HEAD" ? "HEAD" : "GET");
  } catch (error) {
    console.error(`[minerva-assets] read failed for ${key}`, error);
    return NextResponse.json({ error: "object read failed" }, { status: 502 });
  }

  if (!object) {
    return NextResponse.json({ error: "no such object" }, { status: 404 });
  }

  // A manifest is fully buffered because it must be parsed and validated before
  // it is served — and because the buffered bytes are then the response, not
  // the (now consumed) stream. A HEAD is metadata only: it reports the stored
  // size and never re-reads or re-validates the document.
  let manifestBody: Uint8Array<ArrayBuffer> | null = null;
  const head = request.method === "HEAD";

  if (isManifestKey(key) && !head) {
    manifestBody = await readCapped(object, 1024 * 1024);
    if (manifestBody === null) {
      return NextResponse.json({ error: "manifest too large" }, { status: 502 });
    }
    let manifest: unknown;
    try {
      manifest = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(manifestBody));
    } catch {
      return NextResponse.json({ error: "manifest is not valid JSON" }, { status: 502 });
    }
    try {
      validateChannelManifest(manifest);
    } catch (error) {
      const detail = error instanceof ProtocolError ? error.message : "unknown validation failure";
      return NextResponse.json({ error: "manifest failed protocol validation", detail }, { status: 502 });
    }
  }

  const headers: Record<string, string> = {
    "content-type": object.contentType,
    "accept-ranges": "bytes",
    // This origin never rewrites a key, so a client that resolved one can
    // cache it. The publisher's keys are immutable under a build prefix.
    "cache-control": key.startsWith("releases/channel-builds/") || key.startsWith("releases/tag/")
      ? "public, max-age=31536000, immutable"
      : "no-cache",
    "x-content-type-options": "nosniff",
  };
  if (object.size > 0) headers["content-length"] = String(object.size);
  if (object.etag) headers.etag = object.etag;
  if (object.lastModified) headers["last-modified"] = object.lastModified;

  // A HEAD must carry the headers a GET would and no body; both drivers return
  // a null body for HEAD, and a validated manifest replies from its buffer.
  return new NextResponse(manifestBody ?? object.body, { status: 200, headers });
}

/** `releases/channel-builds/<32 hex>/build.json` — the only validated manifest location. */
function isManifestKey(key: string): boolean {
  const parts = key.split("/");
  return parts.length === 4 && parts[0] === "releases" && parts[1] === "channel-builds" && parts[3] === "build.json";
}

async function readCapped(object: { body: ReadableStream<Uint8Array> | null; size: number }, limit: number) {
  if (!object.body || object.size > limit) return null;
  const reader = object.body.getReader();
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

export const GET = handle;
export const HEAD = handle;
