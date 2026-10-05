import { NextResponse } from "next/server";

import { channelRecordKey, validateChannelRecord } from "@/lib/protocol";
import { createStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * GET /releases/channels/<channel>.json — the one object every installed
 * client reads before it knows whether an update exists.
 *
 * Served only after the record validates against the protocol grammar. A record
 * a client would reject is worse than a 404 here: the client's resolver has no
 * fallback for a malformed body, so a broken publish would take the whole
 * channel offline instead of leaving it on its current build.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ channel: string }> }
) {
  const { channel } = await params;

  // The route segment carries the file name, so the param arrives as
  // `<channel>.json`. The suffix is required rather than trimmed: an update
  // origin should answer exactly the paths the protocol names and nothing else.
  if (!channel.endsWith(".json")) {
    return NextResponse.json({ error: "channel records are served as <channel>.json" }, { status: 404 });
  }

  let key: string;
  try {
    // Validates the channel-name grammar, so the assembled key is safe by
    // construction and never reaches the storage layer unvalidated.
    key = channelRecordKey(channel.slice(0, -".json".length));
  } catch (error) {
    return NextResponse.json({ error: messageOf(error) }, { status: 404 });
  }

  const storage = createStorage();

  let object;
  try {
    object = await storage.get(key, "GET");
  } catch (error) {
    return serverError(error);
  }
  if (!object) return missing();

  // Read fully: a channel record is small, and validation needs the whole
  // document. The size ceiling keeps a misconfigured origin from streaming an
  // unbounded body into memory.
  const limit = 256 * 1024;
  const bytes = await readCapped(object, limit);
  if (bytes === null) {
    return NextResponse.json({ error: "channel record too large" }, { status: 502 });
  }

  let record: unknown;
  try {
    record = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return NextResponse.json({ error: "channel record is not valid JSON" }, { status: 502 });
  }

  try {
    validateChannelRecord(record);
  } catch (error) {
    // Refusing to serve is deliberate: see the doc comment. The reason goes in
    // the body because whoever published this needs to see WHICH rule broke.
    return NextResponse.json(
      { error: "channel record failed protocol validation", detail: messageOf(error) },
      { status: 502 }
    );
  }

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "content-type": "application/json",
      // Clients revalidate on every check (their resolver sends no-cache), so
      // this origin must never let an intermediary serve a stale head.
      "cache-control": "no-cache, no-store, must-revalidate",
      ...(object.etag ? { etag: object.etag } : {}),
    },
  });
}

function missing(): NextResponse {
  // 404, not an empty record: the client distinguishes "no such channel" from
  // "channel exists with no head yet", and the latter is a real state (a
  // published channel whose first build has not landed).
  return NextResponse.json({ error: "no such channel" }, { status: 404 });
}

function serverError(error: unknown): NextResponse {
  console.error("[minerva-assets] channel read failed", error);
  return NextResponse.json({ error: "channel read failed" }, { status: 502 });
}

async function readCapped(object: { body: ReadableStream<Uint8Array> | null; size: number }, limit: number) {
  if (!object.body) return null;
  if (object.size > limit) return null;

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

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
