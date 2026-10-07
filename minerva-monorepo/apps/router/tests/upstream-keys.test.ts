/**
 * Contract tests for the upstream key pool.
 *
 * Fridays's fire proved the premise: a single rate-limited key takes down every tenant. The pool
 * keeps N keys and fails the in-flight request over to a fresh key on 429/5xx/transport errors.
 * A key parked by a 429 must not serve again until its cooldown expires — but it must come back,
 * not stay exiled forever (that would turn a transient limit into a permanent capacity cut).
 */

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { chatOnce, chatStream } from '../src/upstream.js';
import {
  cooldownMsFor,
  failoverClass,
  sharedKeyPool,
  upstreamKeys,
  UpstreamKeyPool,
  type FailoverClass,
} from '../src/upstream-keys.js';

const realFetch = globalThis.fetch;
const savedPlural = process.env.OPENROUTER_API_KEYS;
const savedSingular = process.env.OPENROUTER_API_KEY;

function setKeys(plural?: string, singular?: string): void {
  if (plural === undefined) delete process.env.OPENROUTER_API_KEYS;
  else process.env.OPENROUTER_API_KEYS = plural;
  if (singular === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = singular;
}

afterEach(() => {
  globalThis.fetch = realFetch;
  sharedKeyPool().reset();
  if (savedPlural === undefined) delete process.env.OPENROUTER_API_KEYS;
  else process.env.OPENROUTER_API_KEYS = savedPlural;
  if (savedSingular === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = savedSingular;
});

// --- env parsing ---

test('plural wins over singular when both are set', () => {
  setKeys('k1,k2,k3', 'solo');
  assert.deepEqual(upstreamKeys(), ['k1', 'k2', 'k3']);
});

test('singular alone is a one-key pool', () => {
  setKeys(undefined, 'solo');
  assert.deepEqual(upstreamKeys(), ['solo']);
});

test('neither set is an empty pool, not a crash', () => {
  setKeys(undefined, undefined);
  assert.deepEqual(upstreamKeys(), []);
});

test('entries are trimmed and empties dropped', () => {
  setKeys('  k1 ,, k2,', undefined);
  assert.deepEqual(upstreamKeys(), ['k1', 'k2']);
});

// --- classification ---

test('failover classes route retryable failures to the next key', () => {
  // The pool's table, not a status range: dead/rejected keys (401/403), a broke
  // key (402), rate limits (429) and transient gateway errors (502/503/504)
  // are worth another key. Unknown 4xx/5xx fail closed — a 500 may be
  // request-specific, and spraying it across every key burns the whole pool.
  // (Transport errors never reach this function; the catch at the call site
  // parks the key directly.)
  const cases: Array<[number, FailoverClass]> = [
    [429, 'retry'],
    [401, 'retry'],
    [402, 'retry'],
    [403, 'retry'],
    [502, 'retry'],
    [503, 'retry'],
    [504, 'retry'],
    [200, 'terminal'],
    [400, 'terminal'],
    [404, 'terminal'],
    [408, 'terminal'],
    [500, 'terminal'],
  ];
  for (const [input, want] of cases) {
    assert.equal(failoverClass(input), want, `class(${String(input)})`);
  }
});

test('cooldowns park a 429 the longest and never park a terminal status', () => {
  assert.equal(cooldownMsFor(429), 60_000);
  assert.equal(cooldownMsFor(401), 600_000, 'a rejected key is likely dead, not busy');
  assert.equal(cooldownMsFor(502), 30_000);
  assert.equal(cooldownMsFor('transport'), 30_000);
  assert.equal(cooldownMsFor(400), null, 'terminal statuses park nothing');
  assert.equal(cooldownMsFor(500), null);
});

// --- pool mechanics (fresh pool, no shared state) ---

test('picks rotate across keys while all are healthy', () => {
  const pool = new UpstreamKeyPool();
  const seen = new Set([pool.pick(3), pool.pick(3), pool.pick(3)]);
  assert.deepEqual(seen, new Set([0, 1, 2]));
});

test('a cooled-down key is skipped, then serves again after expiry', () => {
  const pool = new UpstreamKeyPool();
  pool.report(0, 60_000, 1_000);
  assert.notEqual(pool.pick(3, 2_000), 0, 'key 0 must sit out its cooldown');
  // After the 60 s window passes the key is eligible again — exile is never permanent.
  const after = new Set([pool.pick(3, 61_001), pool.pick(3, 61_001), pool.pick(3, 61_001)]);
  assert.ok(after.has(0), 'key 0 must return after its cooldown expires');
});

test('report with null clears a cooldown early', () => {
  const pool = new UpstreamKeyPool();
  pool.report(0, 60_000, 1_000);
  pool.report(1, 60_000, 1_000);
  pool.report(1, null);
  // Key 0 is still parked, so the cleared key 1 must win — a success clears
  // the park immediately rather than waiting out the cooldown.
  assert.equal(pool.pick(2, 2_000), 1);
});

// --- chatOnce failover ---

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('chatOnce fails over: a 429 on the first key retries the same body on the next', async () => {
  setKeys('k1,k2', undefined);
  const triedBearers: string[] = [];
  const triedBodies: string[] = [];
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    const headers = init.headers as Record<string, string>;
    triedBearers.push(headers.authorization ?? '(missing)');
    triedBodies.push(String(init.body));
    if (triedBearers.length === 1) return jsonResponse(429, { error: 'limited' });
    return jsonResponse(200, { choices: [] });
  }) as typeof fetch;

  const result = await chatOnce('anthropic/claude-opus-4.6', { messages: [] });

  assert.equal(result.status, 200);
  assert.deepEqual(new Set(triedBearers), new Set(['Bearer k1', 'Bearer k2']));
  assert.equal(triedBodies.length, 2);
  assert.equal(triedBodies[0], triedBodies[1], 'the retried body must be identical');
});

test('chatOnce sad path: every key limited returns the last 429, never a synthesized error', async () => {
  setKeys('k1,k2', undefined);
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return jsonResponse(429, { error: 'limited' });
  }) as typeof fetch;

  const result = await chatOnce('anthropic/claude-opus-4.6', { messages: [] });

  assert.equal(calls, 2, 'each key is tried exactly once');
  assert.equal(result.status, 429);
});

test('chatOnce does not retry a 400: terminal statuses return as-is on the first key', async () => {
  setKeys('k1,k2', undefined);
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return jsonResponse(400, { error: 'bad request' });
  }) as typeof fetch;

  const result = await chatOnce('anthropic/claude-opus-4.6', { messages: [] });

  assert.equal(calls, 1, 'retrying a 400 cannot help — the second key stays untouched');
  assert.equal(result.status, 400);
});

// --- chatStream failover ---

test('chatStream fails over to the next key before streaming starts', async () => {
  setKeys('k1,k2', undefined);
  const triedBearers: string[] = [];
  const encoder = new TextEncoder();
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    const headers = init.headers as Record<string, string>;
    triedBearers.push(headers.authorization ?? '(missing)');
    if (triedBearers.length === 1) return jsonResponse(429, { error: 'limited' });
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[]}\n\n'));
        controller.close();
      },
    });
    return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
  }) as typeof fetch;

  const res = await chatStream('anthropic/claude-opus-4.6', {}, () => {});
  const text = await res.text();

  assert.equal(res.status, 200);
  assert.match(text, /choices/);
  assert.deepEqual(new Set(triedBearers), new Set(['Bearer k1', 'Bearer k2']));
});
