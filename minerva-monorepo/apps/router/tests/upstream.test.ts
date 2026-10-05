/**
 * Contract tests for the SSE instrumentation.
 *
 * This is the highest-risk code in the router: usage only arrives in the FINAL chunk, but the
 * customer may close the tab at any point. If we billed only on clean completion, every
 * abandoned stream would be free inference. If we billed on cancel with a partial value, we
 * would systematically undercharge. So both paths must be proven.
 */

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { chatStream, type ChatUsage } from '../src/upstream.js';

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

function sseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  let i = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(chunks[i] ?? ''));
      i += 1;
    },
  });
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
}

function chunk(content: string | null, usage?: ChatUsage): string {
  const payload: Record<string, unknown> = {
    id: 'x',
    object: 'chat.completion.chunk',
    choices: [{ index: 0, delta: content === null ? {} : { content }, finish_reason: null }],
  };
  if (usage) {
    payload.usage = {
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      total_tokens: usage.promptTokens + usage.completionTokens,
    };
  }
  return `data: ${JSON.stringify(payload)}\n\n`;
}

test('usage is captured from the final chunk on clean completion', async () => {
  globalThis.fetch = (async () =>
    sseResponse([
      chunk('a'),
      chunk('b'),
      chunk(null, { promptTokens: 1200, completionTokens: 300 }),
      'data: [DONE]\n\n',
    ])) as typeof fetch;

  const seen: Array<ChatUsage | null> = [];
  const res = await chatStream('anthropic/claude-opus-4.6', {}, (u) => seen.push(u));

  // Drain fully, as a browser would.
  await res.text();

  assert.equal(seen.length, 1, 'onUsage must fire exactly once');
  assert.deepEqual(seen[0], { promptTokens: 1200, completionTokens: 300 });
});

test('include_usage is requested so a final usage chunk exists at all', async () => {
  let sent: Record<string, unknown> = {};
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    sent = JSON.parse(String(init.body)) as Record<string, unknown>;
    return sseResponse([chunk('a'), chunk(null, { promptTokens: 10, completionTokens: 2 })]);
  }) as typeof fetch;

  const res = await chatStream('anthropic/claude-opus-4.6', {}, () => {});
  await res.text();

  assert.deepEqual(sent.stream_options, { include_usage: true });
  assert.equal(sent.stream, true);
  assert.equal(sent.model, 'anthropic/claude-opus-4.6');
});

test('a client disconnect still bills: the stream is drained in the background', async () => {
  globalThis.fetch = (async () =>
    sseResponse([
      chunk('a'),
      chunk('b'),
      chunk('c'),
      chunk(null, { promptTokens: 5000, completionTokens: 900 }),
    ])) as typeof fetch;

  const seen: Array<ChatUsage | null> = [];
  const res = await chatStream('anthropic/claude-opus-4.6', {}, (u) => seen.push(u));

  const reader = res.body!.getReader();
  await reader.read(); // consume one chunk, then walk away
  await reader.cancel();

  // The background drain must finish reading upstream and settle with the FULL usage, not the
  // partial value at cancel time.
  for (let i = 0; i < 100 && seen.length === 0; i += 1) {
    await new Promise((r) => setTimeout(r, 5));
  }

  assert.equal(seen.length, 1, 'onUsage must still fire after a client disconnect');
  assert.deepEqual(seen[0], { promptTokens: 5000, completionTokens: 900 });
});

test('usage arriving without a [DONE] sentinel is still picked up', async () => {
  globalThis.fetch = (async () =>
    sseResponse([chunk('a'), chunk(null, { promptTokens: 7, completionTokens: 3 })])) as typeof fetch;

  const seen: Array<ChatUsage | null> = [];
  const res = await chatStream('anthropic/claude-opus-4.6', {}, (u) => seen.push(u));
  await res.text();

  assert.deepEqual(seen[0], { promptTokens: 7, completionTokens: 3 });
});

test('a stream with no usage chunk settles as null rather than inventing zero', async () => {
  globalThis.fetch = (async () => sseResponse([chunk('a'), chunk('b')])) as typeof fetch;

  const seen: Array<ChatUsage | null> = [];
  const res = await chatStream('anthropic/claude-opus-4.6', {}, (u) => seen.push(u));
  await res.text();

  assert.equal(seen.length, 1);
  assert.equal(seen[0], null, 'unknown usage must be null, never 0 — the caller logs it');
});

test('client bytes pass through unmodified', async () => {
  globalThis.fetch = (async () =>
    sseResponse([chunk('hello'), chunk(null, { promptTokens: 1, completionTokens: 1 })])) as typeof fetch;

  const res = await chatStream('anthropic/claude-opus-4.6', {}, () => {});
  const text = await res.text();

  assert.match(text, /"content":"hello"/);
});
