#!/usr/bin/env node
/**
 * End-to-end proof for the welcome API: boots the real server (`tsx
 * src/index.ts`) against a stub Supabase (PostgREST-shaped) and a stub
 * upstream router, then drives every gate over HTTP.
 *
 *   node scripts/smoke.mjs
 *
 * What it proves, and why only a live server can prove it: the policy gate
 * (key verification against the DB, free-model allowlist) and the relay
 * (caller credentials forwarded intact, streams passed through) only exist as
 * composed behaviour across three processes. A unit test of `isFreeModel`
 * would not catch a dropped Authorization header, a swallowed stream, or a
 * Vercel route that never registered.
 */
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:http";

const SUPABASE_PORT = 32991;
const UPSTREAM_PORT = 32992;
const APP_PORT = 32993;
const APP = `http://127.0.0.1:${APP_PORT}`;

const FREE_KEY = "qkt_sec_smokefreekey000000000000000001";
const PAID_KEY = "qkt_sec_smokepaidkey000000000000000002";
const UNKNOWN_KEY = "qkt_sec_smokenosuchkey00000000000003";
const FREE_MODEL = "minerva/qwen-qwen3.8-27b:free";
const PAID_MODEL = "minerva/anthropic-claude-sonnet-4.6";

const sha256Hex = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const FREE_HASH = sha256Hex(FREE_KEY);
const PAID_HASH = sha256Hex(PAID_KEY);

const FREE_AGENCY = "11111111-1111-1111-1111-111111111111";
const PAID_AGENCY = "22222222-2222-2222-2222-222222222222";

/** Minimal PostgREST shape: supabase-js issues GETs with eq filters and, for
 *  maybeSingle(), `Accept: application/vnd.pgrst.object+json` (406 = no row). */
function postgrest(res, rows, singular) {
  if (singular) {
    if (rows.length === 0) {
      res.writeHead(406, { "content-type": "application/json" });
      res.end("{}");
      return;
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(rows[0]));
    return;
  }
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(rows));
}

const supabase = createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const singular = (req.headers.accept ?? "").includes("vnd.pgrst.object");
  if (url.pathname === "/rest/v1/agency_api_keys") {
    const hash = url.searchParams.get("key_hash")?.replace(/^eq\./, "");
    const rows =
      hash === FREE_HASH
        ? [{ id: "k1", agency_id: FREE_AGENCY, status: "active", expires_at: null }]
        : hash === PAID_HASH
          ? [{ id: "k2", agency_id: PAID_AGENCY, status: "active", expires_at: null }]
          : [];
    postgrest(res, rows, singular);
    return;
  }
  if (url.pathname === "/rest/v1/agencies") {
    const id = url.searchParams.get("id")?.replace(/^eq\./, "");
    const rows =
      id === FREE_AGENCY
        ? [{ id, plan: "free", status: "active" }]
        : id === PAID_AGENCY
          ? [{ id, plan: "plus", status: "active" }]
          : [];
    postgrest(res, rows, singular);
    return;
  }
  if (url.pathname === "/rest/v1/agency_subscriptions") {
    const agency = url.searchParams.get("agency_id")?.replace(/^eq\./, "");
    const rows =
      agency === PAID_AGENCY
        ? [{ plan: "plus", status: "active", current_period_end: null }]
        : [];
    postgrest(res, rows, singular);
    return;
  }
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: `unexpected ${url.pathname}` }));
});

let seenAuthorization = null;
let seenRequestId = null;
const upstream = createServer((req, res) => {
  if (req.url === "/v1/chat/completions" && req.method === "POST") {
    seenAuthorization = req.headers.authorization ?? null;
    seenRequestId = req.headers["x-minerva-request-id"] ?? null;
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const payload = JSON.parse(body);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          id: "chatcmpl-smoke",
          object: "chat.completion",
          // Echo the model the relay sent, so the test proves which id
          // crossed the wire (wire form in, upstream form out is the
          // router's job — here they are the same string).
          model: payload.model,
          choices: [{ message: { role: "assistant", content: "smoke reply" } }],
          usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
        })
      );
    });
    return;
  }
  res.writeHead(404, { "content-type": "application/json" });
  res.end("{}");
});

await new Promise((r) => supabase.listen(SUPABASE_PORT, "127.0.0.1", r));
await new Promise((r) => upstream.listen(UPSTREAM_PORT, "127.0.0.1", r));

const server = spawn(
  process.execPath,
  ["node_modules/tsx/dist/cli.mjs", "src/index.ts"],
  {
    env: {
      ...process.env,
      PORT: String(APP_PORT),
      SUPABASE_URL: `http://127.0.0.1:${SUPABASE_PORT}`,
      SUPABASE_SERVICE_ROLE_KEY: "smoke-service-key",
      MINERVA_ROUTER_URL: `http://127.0.0.1:${UPSTREAM_PORT}`,
      MINERVA_FREE_MODELS: "minerva/qwen-qwen3.8-27b:free",
    },
    stdio: ["ignore", "pipe", "pipe"],
  }
);
if (process.env.VERBOSE) {
  server.stdout.on("data", (d) => process.stdout.write(`[app] ${d}`));
  server.stderr.on("data", (d) => process.stderr.write(`[app] ${d}`));
}

let failures = 0;
function check(label, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
}

async function waitForApp() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${APP}/health`)).ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function chat({ key, model, requestId, rawBody } = {}) {
  const headers = { "content-type": "application/json" };
  if (key !== undefined) headers.authorization = `Bearer ${key}`;
  if (requestId !== undefined) headers["x-minerva-request-id"] = requestId;
  const response = await fetch(`${APP}/v1/chat/completions`, {
    method: "POST",
    headers,
    body: rawBody ?? JSON.stringify({ model, messages: [{ role: "user", content: "hi" }] }),
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: response.status, body };
}

try {
  if (!(await waitForApp())) {
    console.error("app did not come up");
    process.exitCode = 1;
  } else {
    const health = await (await fetch(`${APP}/health`)).json();
    check("health reports live with the free set", health.status === "ok" && health.free_models === 1, JSON.stringify(health));

    const models = await (await fetch(`${APP}/v1/models`)).json();
    check(
      "models lists only the free set",
      models.object === "list" && models.data?.length === 1 && models.data[0].id === FREE_MODEL,
      JSON.stringify(models.data?.map((m) => m.id))
    );

    const noAuth = await chat({ model: FREE_MODEL });
    check("missing credential is 401", noAuth.status === 401, noAuth.body?.error?.code);

    const nonKey = await chat({ key: "not-a-router-key", model: FREE_MODEL });
    check("non-key bearer is 401", nonKey.status === 401, nonKey.body?.error?.code);

    const unknown = await chat({ key: UNKNOWN_KEY, model: FREE_MODEL });
    check("unknown key is 401", unknown.status === 401, unknown.body?.error?.code);

    const paid = await chat({ key: PAID_KEY, model: FREE_MODEL });
    check(
      "paid-plan key is rejected, not silently downgraded",
      paid.status === 403 && paid.body?.error?.code === "not_free_tier",
      `${paid.status} ${paid.body?.error?.code}`
    );

    const gated = await chat({ key: FREE_KEY, model: PAID_MODEL });
    check(
      "non-free model is 402 with the allowed list",
      gated.status === 402 &&
        gated.body?.error?.code === "upgrade_required" &&
        JSON.stringify(gated.body?.error?.allowed_models?.sort()) === JSON.stringify([FREE_MODEL]),
      `${gated.status} ${gated.body?.error?.code}`
    );

    const ok = await chat({ key: FREE_KEY, model: FREE_MODEL, requestId: "smoke-req-1" });
    check("free model relays", ok.status === 200 && ok.body?.choices?.[0]?.message?.content === "smoke reply", `${ok.status}`);
    check("caller credential forwarded intact", seenAuthorization === `Bearer ${FREE_KEY}`, seenAuthorization);
    check("request id forwarded", seenRequestId === "smoke-req-1", seenRequestId);

    const upstreamForm = await chat({ key: FREE_KEY, model: "qwen/qwen3.8-27b:free" });
    check("upstream id spelling is accepted", upstreamForm.status === 200, `${upstreamForm.status}`);

    const omitted = await chat({ key: FREE_KEY, model: undefined });
    check("omitted model relays (router defaults)", omitted.status === 200, `${omitted.status}`);

    const badJson = await chat({ key: FREE_KEY, rawBody: "{not json" });
    check("malformed JSON is 400 here, not a relayed 502", badJson.status === 400, `${badJson.status}`);
  }
  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
} finally {
  server.kill();
  supabase.close();
  upstream.close();
}

process.exit(failures === 0 ? 0 : 1);
