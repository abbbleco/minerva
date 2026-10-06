/**
 * Agency-web intake proxy tests (Phase 5): the proxy adds auth, never
 * logic — upstream status/body pass through verbatim, the site key rides as
 * `x-minerva-api-key`, and a missing upstream config 503s without calling
 * out. Global fetch is stubbed; no network.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { POST } from "../app/api/v1/intake/route";

function req(body: unknown): Request {
  return new Request("http://test/api/v1/intake", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function withEnv(env: Record<string, string | undefined>, fn: () => Promise<void>): Promise<void> {
  const saved: Record<string, string | undefined> = {};
  for (const key of Object.keys(env)) {
    saved[key] = process.env[key];
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key];
  }
  return fn().finally(() => {
    for (const key of Object.keys(env)) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });
}

test("forwards body verbatim with the site key and returns status/body intact", async () => {
  const seen: Array<{ url: string; init: RequestInit }> = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    seen.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify({ ok: true, id: "abc" }), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  try {
    await withEnv({ MINERVA_INTAKE_URL: "https://portal.example/", MINERVA_API_KEY: "qkt_sec_x" }, async () => {
      const res = await POST(req({ brief: "hi", companyWebsite: "" }));
      assert.equal(res.status, 201);
      assert.deepEqual(await res.json(), { ok: true, id: "abc" });
    });
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(seen.length, 1);
  assert.equal(seen[0].url, "https://portal.example/api/v1/intake");
  const headers = new Headers(seen[0].init.headers);
  assert.equal(headers.get("x-minerva-api-key"), "qkt_sec_x");
  assert.deepEqual(JSON.parse(String(seen[0].init.body)), { brief: "hi", companyWebsite: "" });
});

test("optional fields pass through untouched", async () => {
  const realFetch = globalThis.fetch;
  let forwarded: unknown = null;
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    forwarded = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ ok: true, id: "x" }), { status: 201 });
  }) as typeof fetch;
  try {
    await withEnv({ MINERVA_INTAKE_URL: "https://portal.example", MINERVA_API_KEY: "qkt_sec_x" }, async () => {
      const res = await POST(req({ brief: "hi", client_phone: "+27 82 555 0147", media_url: "https://x/y.png" }));
      assert.equal(res.status, 201);
    });
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.deepEqual(forwarded, { brief: "hi", client_phone: "+27 82 555 0147", media_url: "https://x/y.png" });
});

test("upstream errors pass through with their status", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ error: "too many submissions" }), { status: 429 })) as typeof fetch;
  try {
    await withEnv({ MINERVA_INTAKE_URL: "https://portal.example", MINERVA_API_KEY: "qkt_sec_x" }, async () => {
      const res = await POST(req({ brief: "hi" }));
      assert.equal(res.status, 429);
      assert.deepEqual((await res.json()) as unknown, { error: "too many submissions" });
    });
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("missing upstream config 503s without calling out", async () => {
  let called = false;
  const realFetch = globalThis.fetch;
  globalThis.fetch = ((async () => {
    called = true;
    return new Response("{}");
  }) as unknown) as typeof fetch;
  try {
    await withEnv({ MINERVA_INTAKE_URL: undefined, MINERVA_API_KEY: undefined }, async () => {
      const res = await POST(req({ brief: "hi" }));
      assert.equal(res.status, 503);
    });
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(called, false);
});

test("invalid JSON is a 400 from the proxy itself", async () => {
  await withEnv({ MINERVA_INTAKE_URL: "https://portal.example" }, async () => {
    const res = await POST(req("{oops"));
    assert.equal(res.status, 400);
  });
});
