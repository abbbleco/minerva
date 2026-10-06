/**
 * Upstream intake tests (Phase 5): validation matrix, site-key auth,
 * per-key throttle, store + drain queue + ack scoping. The fake admin runs
 * the real handler functions (handleIntakePost/QueuedGet/AckPost) against
 * in-memory tables — no Supabase, no network.
 */
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";

import {
  handleAckPost,
  handleIntakePost,
  handleQueuedGet,
  parseIntakeBody,
} from "../app/api/v1/intake/_lib";
import { FakeIntakeAdmin } from "./fake-intake-admin";

const KEY_A = "qkt_sec_siteA-key-for-tests-0001";
const KEY_B = "qkt_sec_siteB-key-for-tests-0002";

function hash(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function keyed(token?: string): Record<string, string> {
  return token === undefined ? {} : { "x-minerva-api-key": token };
}

function post(body: unknown, token?: string): Request {
  return new Request("http://test/api/v1/intake", {
    method: "POST",
    headers: { "content-type": "application/json", ...keyed(token) },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function validBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    brief: "Please add CSV export to the dashboard.",
    client_email: "ada@example.com",
    organization_name: "Example Ltd",
    ...overrides,
  };
}

function seeded(): FakeIntakeAdmin {
  const admin = new FakeIntakeAdmin();
  admin.seedKey({ agency_id: "agency-a", key_hash: hash(KEY_A) });
  admin.seedKey({ agency_id: "agency-b", key_hash: hash(KEY_B) });
  return admin;
}

test("parseIntakeBody accepts a full body and defaults the source", () => {
  const parsed = parseIntakeBody(validBody());
  assert.equal(parsed.ok, true);
  assert.equal(parsed.honeypot, false);
  if (parsed.ok) {
    assert.equal(parsed.fields.source, "web_form");
    assert.deepEqual(parsed.fields.brief.slice(0, 10), "Please add");
  }
});

test("parseIntakeBody reports every bad field at once", () => {
  const parsed = parseIntakeBody({ brief: "", client_email: "nope", organization_name: "", media_url: "http://x" });
  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.ok(parsed.fields.brief);
    assert.ok(parsed.fields.client_email);
    assert.ok(parsed.fields.organization_name);
    assert.ok(parsed.fields.media_url);
  }
});

test("parseIntakeBody caps lengths", () => {
  const parsed = parseIntakeBody(validBody({ brief: "x".repeat(5001), organization_name: "y".repeat(121) }));
  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.ok(parsed.fields.brief);
    assert.ok(parsed.fields.organization_name);
  }
});

test("valid submission stores queued and returns the tracking id", async () => {
  const admin = seeded();
  const res = await handleIntakePost(admin, post(validBody(), KEY_A));
  assert.equal(res.status, 201);
  const body = (await res.json()) as { ok: boolean; id: string };
  assert.equal(body.ok, true);
  assert.ok(body.id);
  const rows = admin.submissions();
  assert.equal(rows.length, 1);
  assert.equal(rows[0]["id"], body.id);
  assert.equal(rows[0]["status"], "queued");
  assert.equal(rows[0]["brief"], validBody()["brief"]);
});

test("missing, unknown, revoked, expired and publishable keys all 401 identically", async () => {
  const cases: Array<{ token?: string; seed?: (admin: FakeIntakeAdmin) => void }> = [
    {},
    { token: "qkt_sec_nonexistent" },
  ];
  for (const [i, c] of cases.entries()) {
    const admin = seeded();
    c.seed?.(admin);
    const res = await handleIntakePost(admin, post(validBody(), c.token));
    assert.equal(res.status, 401, `case ${i}`);
    assert.match(((await res.json()) as { error: string }).error, /site key/);
  }

  const revoked = seeded();
  revoked.tables.get("agency_api_keys")!.push({
    agency_id: "agency-a", key_hash: hash("qkt_sec_revoked"), status: "revoked", purpose: "server", expires_at: null,
  });
  const resRevoked = await handleIntakePost(revoked, post(validBody(), "qkt_sec_revoked"));
  assert.equal(resRevoked.status, 401);

  const expired = seeded();
  expired.tables.get("agency_api_keys")!.push({
    agency_id: "agency-a", key_hash: hash("qkt_sec_expired"), status: "active", purpose: "server",
    expires_at: new Date(Date.now() - 1000).toISOString(),
  });
  const resExpired = await handleIntakePost(expired, post(validBody(), "qkt_sec_expired"));
  assert.equal(resExpired.status, 401);

  const publishable = seeded();
  publishable.tables.get("agency_api_keys")!.push({
    agency_id: "agency-a", key_hash: hash("qkt_pub_browser"), status: "active", purpose: "publishable", expires_at: null,
  });
  const resPub = await handleIntakePost(publishable, post(validBody(), "qkt_pub_browser"));
  assert.equal(resPub.status, 401);
});

test("malformed bodies 400 with field errors", async () => {
  const admin = seeded();
  const badJson = await handleIntakePost(admin, post("{oops", KEY_A));
  assert.equal(badJson.status, 400);
  const res = await handleIntakePost(admin, post({ brief: "x" }, KEY_A));
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error: string; fields: Record<string, string> };
  assert.equal(body.error, "invalid submission");
  assert.ok(body.fields.client_email);
});

test("honeypot accepts-and-discards with an unpersisted id", async () => {
  const admin = seeded();
  const res = await handleIntakePost(admin, post({ ...validBody(), companyWebsite: "https://spam.example" }, KEY_A));
  assert.equal(res.status, 201);
  const body = (await res.json()) as { ok: boolean; id: string };
  assert.equal(body.ok, true);
  assert.ok(body.id);
  assert.equal(admin.submissions().length, 0);
});

test("sixth submission inside the hour is throttled with retry-after", async () => {
  const admin = seeded();
  for (let i = 0; i < 5; i++) {
    const res = await handleIntakePost(admin, post(validBody(), KEY_A));
    assert.equal(res.status, 201);
  }
  const sixth = await handleIntakePost(admin, post(validBody(), KEY_A));
  assert.equal(sixth.status, 429);
  assert.equal(sixth.headers.get("retry-after"), "3600");
  // The other site's key is unaffected.
  const other = await handleIntakePost(admin, post(validBody(), KEY_B));
  assert.equal(other.status, 201);
});

test("phone is optional but validated when present", async () => {
  const admin = seeded();
  const withPhone = await handleIntakePost(
    admin, post(validBody({ client_phone: "+27 82 555 0147" }), KEY_A));
  assert.equal(withPhone.status, 201);
  assert.equal(admin.submissions()[0]["client_phone"], "+27 82 555 0147");

  const badPhone = await handleIntakePost(admin, post(validBody({ client_phone: "not-a-number!!" }), KEY_A));
  assert.equal(badPhone.status, 400);
  const body = (await badPhone.json()) as { fields: Record<string, string> };
  assert.ok(body.fields.client_phone);

  const queued = await handleQueuedGet(
    admin, new Request("http://test/api/v1/intake/queued", { headers: keyed(KEY_A) }));
  const list = ((await queued.json()) as { submissions: Array<{ client_phone?: string }> }).submissions;
  assert.equal(list[0].client_phone, "+27 82 555 0147");
});

test("queued lists oldest-first, scoped to the calling key", async () => {
  const admin = seeded();
  await handleIntakePost(admin, post(validBody({ brief: "first" }), KEY_A));
  await handleIntakePost(admin, post(validBody({ brief: "second" }), KEY_A));
  await handleIntakePost(admin, post(validBody({ brief: "foreign" }), KEY_B));

  const get = (token: string, qs = "") =>
    new Request(`http://test/api/v1/intake/queued${qs}`, { headers: keyed(token) });
  const resA = await handleQueuedGet(admin, get(KEY_A));
  assert.equal(resA.status, 200);
  const listA = ((await resA.json()) as { submissions: Array<{ brief: string }> }).submissions;
  assert.deepEqual(listA.map((s) => s.brief), ["first", "second"]);

  const resB = await handleQueuedGet(admin, get(KEY_B));
  const listB = ((await resB.json()) as { submissions: Array<{ brief: string }> }).submissions;
  assert.deepEqual(listB.map((s) => s.brief), ["foreign"]);

  const limited = await handleQueuedGet(admin, get(KEY_A, "?limit=1"));
  assert.equal((((await limited.json()) as { submissions: unknown[] }).submissions).length, 1);

  const badLimit = await handleQueuedGet(admin, get(KEY_A, "?limit=nope"));
  assert.equal(badLimit.status, 400);
  const unauth = await handleQueuedGet(admin, get("qkt_sec_wrong"));
  assert.equal(unauth.status, 401);
});

test("ack marks done/failed, 404s unknown-or-foreign ids, rejects bad status", async () => {
  const admin = seeded();
  const stored = await handleIntakePost(admin, post(validBody(), KEY_A));
  const id = ((await stored.json()) as { id: string }).id;

  const ack = (token: string, target: string, payload: unknown) =>
    handleAckPost(
      admin,
      new Request(`http://test/api/v1/intake/${target}/ack`, {
        method: "POST",
        headers: { "content-type": "application/json", ...keyed(token) },
        body: JSON.stringify(payload),
      }),
      target,
    );

  const badStatus = await ack(KEY_A, id, { status: "maybe" });
  assert.equal(badStatus.status, 400);
  const foreign = await ack(KEY_B, id, { status: "done" });
  assert.equal(foreign.status, 404);
  const missing = await ack(KEY_A, "00000000-0000-0000-0000-000000000000", { status: "done" });
  assert.equal(missing.status, 404);

  const done = await ack(KEY_A, id, { status: "done" });
  assert.equal(done.status, 200);
  const row = admin.submissions().find((r) => r["id"] === id)!;
  assert.equal(row["status"], "done");
  assert.ok(row["processed_at"]);

  // A failed ack keeps the drain-visible error (capped).
  const stored2 = await handleIntakePost(admin, post(validBody(), KEY_A));
  const id2 = ((await stored2.json()) as { id: string }).id;
  const failed = await ack(KEY_A, id2, { status: "failed", error: "x".repeat(600) });
  assert.equal(failed.status, 200);
  const row2 = admin.submissions().find((r) => r["id"] === id2)!;
  assert.equal(row2["status"], "failed");
  assert.equal(String(row2["error"]).length, 500);

  // Done rows leave the queue.
  const queued = await handleQueuedGet(
    admin,
    new Request("http://test/api/v1/intake/queued", { headers: keyed(KEY_A) }),
  );
  assert.deepEqual(
    (((await queued.json()) as { submissions: Array<{ id: string }> }).submissions).map((s) => s.id),
    [],
  );
});
