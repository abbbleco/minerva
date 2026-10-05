#!/usr/bin/env node
/**
 * End-to-end proof for the release origin: boot the real `next start` against a
 * temp object root, publish a channel record, a manifest and an artifact
 * through the authenticated write path, then read them back over HTTP.
 *
 *   npm run build && node scripts/smoke.mjs
 *
 * The authorization, validation, immutability and atomicity rules are only
 * meaningful against a running server — a unit test would not catch a route
 * that never registered, a header Next strips, or a Windows fsync rejection.
 */
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const PORT = Number(process.env.SMOKE_PORT ?? 3199);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const TOKEN = "smoke-token-not-a-real-secret";
const root = await mkdtemp(path.join(tmpdir(), "minerva-assets-smoke-"));

const BUILD_ID = "0123456789abcdef0123456789abcdef";
const RECORD_KEY = "releases/channels/stable.json";
const MANIFEST_KEY = `releases/channel-builds/${BUILD_ID}/build.json`;
const ARTIFACT_KEY = `releases/channel-builds/${BUILD_ID}/Minerva-1.2.3-win-x64.msix`;

const IDENTITY = {
  token: "0123456789abcdef",
  displayName: "Minerva",
  appId: "co.abbble.minerva",
  appNamePascal: "Minerva",
  artifactNamePascal: "Minerva",
  cliName: "minerva",
  windowsExecutableName: "Minerva",
  msixAppIdWithOrg: "ABBBLE.Minerva",
};

const RECORD = {
  schema: 1,
  name: "stable",
  repository: "ABBBLE/minerva",
  policy: "stable-release",
  revision: 1,
  nextSequence: 2,
  state: "active",
  identity: IDENTITY,
  head: {
    buildId: BUILD_ID,
    sequence: 1,
    manifestKey: MANIFEST_KEY,
    sha256: "0".repeat(64),
  },
};

const MANIFEST = {
  schema: 1,
  request: {
    schema: 1,
    buildId: BUILD_ID,
    channel: "stable",
    sequence: 1,
    repository: "ABBBLE/minerva",
    commit: "a".repeat(40),
    sourceVersion: "1.2.3",
    version: "1.2.3",
    windowsVersion: "1.2.3.0",
    publicBase: "https://minerva-assets.abbble.co.za",
    bundleEnv: {},
    identity: IDENTITY,
    releaseTag: "v1.2.3",
  },
  packages: [
    {
      platform: "win32",
      arch: "x64",
      variant: "bundled",
      version: "1.2.3.0",
      identity: IDENTITY.msixAppIdWithOrg,
      artifact: { key: ARTIFACT_KEY, sha256: "b".repeat(64), size: 44 },
      publisher: "ABBBLE",
      feed: { key: `releases/channel-builds/${BUILD_ID}/stable.appinstaller`, channel: "stable" },
    },
  ],
};

let failures = 0;
function check(label, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
}

const server = spawn(
  process.execPath,
  [path.join("node_modules", "next", "dist", "bin", "next"), "start", "--port", String(PORT)],
  {
    env: {
      ...process.env,
      MINERVA_ASSETS_ROOT: root,
      MINERVA_ASSETS_PUBLISH_TOKEN: TOKEN,
      NEXT_PUBLIC_SITE_URL: "https://minerva-assets.abbble.co.za",
    },
    stdio: ["ignore", "pipe", "pipe"],
  }
);
if (process.env.VERBOSE) {
  server.stdout.on("data", (d) => process.stdout.write(`[next] ${d}`));
  server.stderr.on("data", (d) => process.stderr.write(`[next] ${d}`));
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      if ((await fetch(`${ORIGIN}/health`)).ok) return true;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function publish(key, value, { token = TOKEN, headers = {}, expect = 201 } = {}) {
  const response = await fetch(`${ORIGIN}/api/publish?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: typeof value === "string" || value instanceof Uint8Array ? value : JSON.stringify(value),
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: response.status, body, ok: response.status === expect };
}

try {
  if (!(await waitForServer())) {
    console.error("server did not come up (did you run `npm run build`?)");
    server.kill();
    process.exit(1);
  }

  const health = await (await fetch(`${ORIGIN}/health`)).json();
  check("health reports a filesystem source", String(health.storage).startsWith("fs:"), health.storage);

  // Authorization. An origin with no token has no publish path at all.
  check("publish without a token is rejected", (await publish(RECORD_KEY, RECORD, { token: null, expect: 401 })).ok);
  check("publish with a wrong token is rejected", (await publish(RECORD_KEY, RECORD, { token: "wrong", expect: 401 })).ok);

  // Validation happens BEFORE storage: a malformed record would be served to
  // every installed client, which has no fallback for it.
  const policy = await publish(RECORD_KEY, { ...RECORD, policy: "source-branch" }, { expect: 422 });
  check("a record with an unsupported policy is refused", policy.ok, policy.body?.detail);

  const env = structuredClone(MANIFEST);
  env.request.bundleEnv = { LD_PRELOAD: "/tmp/evil.so" };
  const injected = await publish(MANIFEST_KEY, env, { expect: 422 });
  check("a manifest injecting bundleEnv is refused", injected.ok, injected.body?.detail);

  const feed = structuredClone(MANIFEST);
  feed.packages[0].feed.key = `releases/channel-builds/${BUILD_ID}/stable.exe`;
  const badFeed = await publish(MANIFEST_KEY, feed, { expect: 422 });
  check("a win32 package with a non-.appinstaller feed is refused", badFeed.ok, badFeed.body?.detail);

  const head = structuredClone(RECORD);
  head.head.manifestKey = "releases/channel-builds/elsewhere/build.json";
  const badHead = await publish(RECORD_KEY, head, { expect: 422 });
  check("a head outside its build prefix is refused", badHead.ok, badHead.body?.detail);

  // Key grammar. These are the checks that keep a request on the disk.
  check("a traversal key is refused", (await publish("releases/../../etc/passwd", "x", { expect: 400 })).ok);
  check("a reserved Windows name is refused", (await publish("releases/channel-builds/x/CON.msix", "x", { expect: 400 })).ok);

  // The happy path.
  check("manifest publishes", (await publish(MANIFEST_KEY, MANIFEST)).ok);
  check("record publishes", (await publish(RECORD_KEY, RECORD)).ok);

  const retry = await publish(MANIFEST_KEY, MANIFEST, { expect: 200 });
  check("republishing identical bytes is unchanged", retry.ok && retry.body?.unchanged === true);

  const mutated = structuredClone(MANIFEST);
  mutated.request.commit = "c".repeat(40);
  const conflict = await publish(MANIFEST_KEY, mutated, { expect: 409 });
  check("overwriting a published build is refused", conflict.ok, conflict.body?.error);

  // --- compare-and-swap -----------------------------------------------------
  // The publisher's channel administration replaces a mutable record only when
  // the ETag it read is still current. If this origin ignored the precondition,
  // a concurrent publish would silently lose.
  const readRecord = await fetch(`${ORIGIN}/${RECORD_KEY}`);
  const etag = readRecord.headers.get("etag");
  check("record exposes an ETag", Boolean(etag), etag ?? "(none)");

  const next = { ...RECORD, revision: 2 };
  const swapped = await publish(RECORD_KEY, next, { headers: { "if-match": etag }, expect: 200 });
  check("If-Match with the current ETag succeeds", swapped.ok);

  const stale = await publish(RECORD_KEY, { ...RECORD, revision: 3 }, {
    headers: { "if-match": etag },
    expect: 412,
  });
  check("If-Match with a stale ETag is 412", stale.ok, stale.body?.error);

  const createOnly = await publish("releases/channels/canary.json", RECORD, {
    headers: { "if-none-match": "*" },
    expect: 201,
  });
  check("If-None-Match:* creates a new key", createOnly.ok);
  const createAgain = await publish("releases/channels/canary.json", RECORD, {
    headers: { "if-none-match": "*" },
    expect: 412,
  });
  check("If-None-Match:* on an existing key is 412", createAgain.ok, createAgain.body?.error);

  const bothHeaders = await publish(RECORD_KEY, RECORD, {
    headers: { "if-match": etag, "if-none-match": "*" },
    expect: 400,
  });
  check("contradictory preconditions are 400", bothHeaders.ok, bothHeaders.body?.error);

  // --- authenticated listing ------------------------------------------------
  const listUnauthorized = await fetch(`${ORIGIN}/api/objects?prefix=releases/channels/`);
  check("listing without a token is rejected", listUnauthorized.status === 401);

  const listed = await (
    await fetch(`${ORIGIN}/api/objects?prefix=releases/channels/`, {
      headers: { authorization: `Bearer ${TOKEN}` },
    })
  ).json();
  check(
    "listing returns the published channels",
    Array.isArray(listed.keys) && listed.keys.includes(RECORD_KEY) && listed.keys.includes("releases/channels/canary.json"),
    JSON.stringify(listed.keys)
  );
  check("listing skips in-flight upload temporaries", !listed.keys.some((k) => k.includes(".upload-")));

  const badPrefix = await fetch(`${ORIGIN}/api/objects?prefix=../etc`, {
    headers: { authorization: `Bearer ${TOKEN}` },
  });
  check("a traversal prefix is refused", badPrefix.status === 400);

  // Serving.
  const servedRecord = await fetch(`${ORIGIN}/${RECORD_KEY}`);
  const recordBody = await servedRecord.json();
  check("record is served", servedRecord.ok && recordBody.head?.buildId === BUILD_ID);
  check(
    "record is revalidated, never cached",
    (servedRecord.headers.get("cache-control") ?? "").includes("no-cache"),
    servedRecord.headers.get("cache-control") ?? "(none)"
  );

  const servedManifest = await fetch(`${ORIGIN}/${MANIFEST_KEY}`);
  const manifestBody = await servedManifest.json();
  check("manifest is served", servedManifest.ok && manifestBody.packages?.length === 1);
  check(
    "manifest is immutable-cached",
    (servedManifest.headers.get("cache-control") ?? "").includes("immutable"),
    servedManifest.headers.get("cache-control") ?? "(none)"
  );

  const headRequest = await fetch(`${ORIGIN}/${MANIFEST_KEY}`, { method: "HEAD" });
  check(
    "HEAD returns the length without a body",
    headRequest.ok && (headRequest.headers.get("content-length") ?? "") !== "",
    `content-length ${headRequest.headers.get("content-length")}`
  );

  // An artifact streams through untouched, byte for byte.
  const payload = Buffer.from("not-really-an-msix-but-the-bytes-must-survive");
  check("artifact publishes", (await publish(ARTIFACT_KEY, payload)).ok);
  const back = Buffer.from(await (await fetch(`${ORIGIN}/${ARTIFACT_KEY}`)).arrayBuffer());
  check("artifact round-trips byte for byte", back.equals(payload));

  check("an unknown channel is 404", (await fetch(`${ORIGIN}/releases/channels/nope.json`)).status === 404);
  check("a record path without .json is 404", (await fetch(`${ORIGIN}/releases/channels/stable`)).status === 404);

  // A record that reached disk by some other means still may not be served.
  await mkdir(path.join(root, "releases", "channels"), { recursive: true });
  await writeFile(path.join(root, RECORD_KEY), JSON.stringify({ ...RECORD, revision: 0 }), "utf8");
  const broken = await fetch(`${ORIGIN}/${RECORD_KEY}`);
  check("an invalid stored record is refused at serve time", broken.status === 502, `HTTP ${broken.status}`);

  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
} finally {
  server.kill();
  await rm(root, { recursive: true, force: true }).catch(() => undefined);
}

process.exit(failures === 0 ? 0 : 1);
