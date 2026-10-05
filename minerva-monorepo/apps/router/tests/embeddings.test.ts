/**
 * Contract tests for the embedding dimension guard.
 *
 * 768 is load-bearing: the schema stores `vector(768)` with an HNSW index and the
 * `match_talent` RPC guards the dimension. A provider returning a different size would not
 * error — it would silently produce garbage recall. So the guard must be proven to fire.
 */

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { EMBEDDING_DIMS, embed } from '../src/embeddings.js';

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.OPENROUTER_API_KEY;
});

function mockEmbeddings(dims: number, count: number) {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        data: Array.from({ length: count }, () => ({
          embedding: Array.from({ length: dims }, (_, i) => i / dims),
        })),
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    )) as typeof fetch;
}

test('768-dim vectors pass through', async () => {
  process.env.OPENROUTER_API_KEY = 'test-key';
  mockEmbeddings(EMBEDDING_DIMS, 2);

  const { vectors, promptTokens } = await embed(['hello', 'world']);
  assert.equal(vectors.length, 2);
  assert.equal(vectors[0]?.length, EMBEDDING_DIMS);
  assert.ok(promptTokens > 0, 'token estimate must be non-zero or the spend is invisible');
});

test('a wrong dimension is rejected rather than silently stored', async () => {
  process.env.OPENROUTER_API_KEY = 'test-key';
  mockEmbeddings(512, 1);

  await assert.rejects(() => embed(['hello']), /512 dimensions, expected 768/);
});

test('a short vector count is rejected', async () => {
  process.env.OPENROUTER_API_KEY = 'test-key';
  mockEmbeddings(EMBEDDING_DIMS, 1);

  await assert.rejects(() => embed(['a', 'b', 'c']), /returned 1 vectors for 3 inputs/);
});

test('an empty input short-circuits without an upstream call', async () => {
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    return new Response('{}', { status: 200 });
  }) as typeof fetch;

  const result = await embed([]);
  // `model` is part of the result so the caller can record which vector space produced a row.
  assert.deepEqual(result.vectors, []);
  assert.equal(result.promptTokens, 0);
  assert.ok(result.model.length > 0, 'the model id must be reported, never blank');
  assert.equal(called, false, 'an empty input must not reach upstream');
});

test('a missing key fails loudly instead of returning empty vectors', async () => {
  delete process.env.OPENROUTER_API_KEY;
  await assert.rejects(() => embed(['hello']), /OPENROUTER_API_KEY not configured/);
});

test('an upstream error surfaces the status and body', async () => {
  process.env.OPENROUTER_API_KEY = 'test-key';
  globalThis.fetch = (async () =>
    new Response('quota exceeded', { status: 429 })) as typeof fetch;

  await assert.rejects(() => embed(['hello']), /HTTP 429/);
});
