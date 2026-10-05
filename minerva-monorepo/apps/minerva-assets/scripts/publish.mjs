#!/usr/bin/env node
/**
 * Publish an object to the Minerva Assets origin.
 *
 *   node scripts/publish.mjs --key releases/channel-builds/<buildId>/build.json \
 *        --file build.json \
 *        --origin https://minerva-assets.abbble.co.za
 *
 * Reads MINERVA_ASSETS_PUBLISH_TOKEN from the environment; never takes the
 * secret as an argument, where it would land in the process table and shell
 * history. Prints the origin's JSON result, including the digest it computed,
 * so a pipeline can compare it against the manifest it just wrote.
 *
 * The origin re-validates channel records and manifests before storing them —
 * this client is a convenience, not the safety boundary.
 */
import { createHash } from "node:crypto";
import { createReadStream, statSync } from "node:fs";
import path from "node:path";

const USAGE = `usage: publish.mjs --key <object-key> --file <path> [--origin <url>]

  --key     object key under releases/
  --file     local file to publish
  --origin   origin base URL (default: MINERVA_ASSETS_ORIGIN)

env:
  MINERVA_ASSETS_PUBLISH_TOKEN   required bearer token
  MINERVA_ASSETS_ORIGIN          default origin`;

function fail(message) {
  console.error(`publish: ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.length === 0) {
  console.log(USAGE);
  process.exit(args.length === 0 ? 1 : 0);
}

function option(...names) {
  for (const name of names) {
    const index = args.indexOf(name);
    if (index !== -1 && index + 1 < args.length) return args[index + 1];
  }
  return undefined;
}

const key = option("--key");
const file = option("--file");
const origin = (option("--origin") ?? process.env.MINERVA_ASSETS_ORIGIN ?? "").replace(/\/+$/, "");
const token = process.env.MINERVA_ASSETS_PUBLISH_TOKEN;

if (!key) fail("--key is required\n" + USAGE);
if (!file) fail("--file is required\n" + USAGE);
if (!origin) fail("--origin or MINERVA_ASSETS_ORIGIN is required\n" + USAGE);
if (!token) fail("MINERVA_ASSETS_PUBLISH_TOKEN is not set");

const source = path.resolve(file);
let size;
try {
  size = statSync(source).size;
} catch {
  fail(`cannot read ${source}`);
}

// The digest is computed here as well as at the origin so a mismatch between
// what CI thinks it published and what the origin stored is visible in the log
// rather than discovered later by a client.
const hash = createHash("sha256");
for await (const chunk of createReadStream(source)) hash.update(chunk);
const localSha256 = hash.digest("hex");

const target = `${origin}/api/publish?key=${encodeURIComponent(key)}`;
const response = await fetch(target, {
  method: "POST",
  headers: {
    authorization: `Bearer ${token}`,
    "content-type": "application/octet-stream",
    "content-length": String(size),
  },
  body: createReadStream(source),
  // Node needs this to stream a file body with a known length.
  duplex: "half",
  redirect: "error",
});

const text = await response.text();
let parsed;
try {
  parsed = JSON.parse(text);
} catch {
  console.error(`publish: HTTP ${response.status} ${text.slice(0, 400)}`);
  process.exit(1);
}

if (!response.ok) {
  console.error(`publish: HTTP ${response.status}`, parsed);
  process.exit(1);
}

if (parsed.sha256 && parsed.sha256 !== localSha256) {
  console.error("publish: FAILED — origin stored a different digest than the local file", {
    expected: localSha256,
    stored: parsed.sha256,
  });
  process.exit(1);
}

console.log(
  `publish: ${parsed.unchanged ? "unchanged" : "created"} ${parsed.key} ` +
    `(${parsed.size} bytes, sha256 ${parsed.sha256.slice(0, 16)}…)`
);
