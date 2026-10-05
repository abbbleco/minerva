import { NextResponse } from "next/server";
import { readdir } from "node:fs/promises";
import path from "node:path";

import { authorizePublish } from "@/lib/auth";
import { artifactKey, artifactPrefix, ProtocolError } from "@/lib/protocol";

export const dynamic = "force-dynamic";

/**
 * GET /api/objects?prefix=<key prefix> — authenticated listing.
 *
 * The publisher's channel administration needs to enumerate what exists
 * (`releases/channels/`) to publish a new head safely. That cannot be served
 * publicly: a public listing would publish the archive's internal layout and
 * let anyone enumerate unpublished build ids, so it sits behind the same
 * publish token as the write path.
 *
 * The prefix is validated with the protocol's own key grammar, which admits no
 * traversal segment; the resolved directory is re-checked against the root
 * anyway, because this walks the filesystem.
 *
 * Requires MINERVA_ASSETS_ROOT: a bucket origin cannot enumerate without an
 * index, and this origin does not synthesise one.
 */
export async function GET(request: Request) {
  const auth = authorizePublish(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const root = process.env.MINERVA_ASSETS_ROOT?.trim();
  if (!root) {
    return NextResponse.json(
      { error: "listing requires MINERVA_ASSETS_ROOT" },
      { status: 503 }
    );
  }

  const raw = new URL(request.url).searchParams.get("prefix") ?? "";
  let prefix: string;
  try {
    prefix = artifactPrefix(raw);
  } catch (error) {
    const detail = error instanceof ProtocolError ? error.message : "invalid prefix";
    return NextResponse.json({ error: detail }, { status: 400 });
  }

  const base = path.resolve(root);
  const scan = path.resolve(base, prefix);
  if (scan !== base && !scan.startsWith(base + path.sep)) {
    return NextResponse.json({ error: "prefix escaped the storage root" }, { status: 400 });
  }

  const keys: string[] = [];
  const SKIP = new Set([".upload"]);
  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > 8 || keys.length >= 5000) return;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".") || SKIP.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full, depth + 1);
      } else if (entry.isFile()) {
        const key = path.relative(base, full).split(path.sep).join("/");
        try {
          keys.push(artifactKey(key));
        } catch {
          // A file the protocol could never address; not part of the archive.
        }
      }
      if (keys.length >= 5000) return;
    }
  }
  await walk(scan, 0);

  keys.sort();
  return NextResponse.json(
    { keys },
    { headers: { "cache-control": "no-store" } }
  );
}
