import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  _resetLiveModelsCacheForTests,
  liveCatalog,
  liveFreeWireIds,
  liveModelsForTier,
  resolveLiveModel,
} from '../src/live-models.js';

const savedFetch = globalThis.fetch;
const savedTtl = process.env.MINERVA_MODELS_TTL_SECONDS;

function upstreamList() {
  return {
    data: [
      {
        id: 'anthropic/claude-opus-4.6',
        name: 'Claude Opus 4.6',
        pricing: { prompt: '0.000005', completion: '0.000025' },
        context_length: 200000,
      },
      {
        id: 'openrouter/free',
        name: 'Free Models Router',
        pricing: { prompt: '0', completion: '0' },
        context_length: 128000,
      },
      {
        id: 'qwen/qwen3.8-27b:free',
        name: 'Qwen3.8 27B',
        pricing: { prompt: '0', completion: '0' },
        context_length: 262144,
      },
      // No usable price: dropped, never served unbilled.
      { id: 'mystery/model', name: 'Mystery', pricing: {}, context_length: 8000 },
      // Duplicate wire ID: first wins.
      {
        id: 'anthropic/claude-opus-4.6',
        name: 'Claude Opus 4.6 copy',
        pricing: { prompt: '0.000005', completion: '0.000025' },
        context_length: 200000,
      },
    ],
  };
}

function stubFetch(payload: unknown, ok = true) {
  let calls = 0;
  const fn = async () => {
    calls += 1;
    return { ok, json: async () => payload } as Response;
  };
  globalThis.fetch = fn as typeof fetch;
  return () => calls;
}

function restore() {
  globalThis.fetch = savedFetch;
  _resetLiveModelsCacheForTests();
  if (savedTtl === undefined) delete process.env.MINERVA_MODELS_TTL_SECONDS;
  else process.env.MINERVA_MODELS_TTL_SECONDS = savedTtl;
}

test('live entries map to wire IDs with per-1M prices; unpriced and duplicate rows drop', async () => {
  const calls = stubFetch(upstreamList());
  try {
    process.env.MINERVA_MODELS_TTL_SECONDS = '3600';
    const entries = await liveCatalog();
    assert.ok(entries, 'expected live entries');
    assert.equal(calls(), 1);
    assert.equal(entries.length, 3);
    const opus = entries.find((e) => e.upstreamId === 'anthropic/claude-opus-4.6');
    assert.ok(opus);
    assert.equal(opus.wireId, 'minerva/anthropic-claude-opus-4.6');
    assert.equal(opus.promptPer1M, 5);
    assert.equal(opus.completionPer1M, 25);
    assert.equal(opus.free, false);
    const free = entries.find((e) => e.upstreamId === 'openrouter/free');
    assert.ok(free);
    assert.equal(free.wireId, 'minerva/openrouter-free');
    assert.equal(free.free, true);
    // Fresh cache: no refetch.
    await liveCatalog();
    assert.equal(calls(), 1);
  } finally {
    restore();
  }
});

test('free tier sees only free models; paid tier sees everything', async () => {
  stubFetch(upstreamList());
  try {
    process.env.MINERVA_MODELS_TTL_SECONDS = '3600';
    const free = await liveModelsForTier(false);
    const paid = await liveModelsForTier(true);
    assert.ok(free && paid);
    assert.ok(free.length > 0 && free.every((e) => e.free));
    assert.ok(paid.length > free.length);
    const ids = await liveFreeWireIds();
    assert.ok(ids);
    assert.deepEqual([...ids].sort(), free.map((e) => e.wireId).sort());
  } finally {
    restore();
  }
});

test('resolveLiveModel accepts wire, upstream and bare spellings; unknown is null', async () => {
  stubFetch(upstreamList());
  try {
    process.env.MINERVA_MODELS_TTL_SECONDS = '3600';
    const wire = await resolveLiveModel('minerva/qwen-qwen3.8-27b:free');
    const upstream = await resolveLiveModel('qwen/qwen3.8-27b:free');
    const bare = await resolveLiveModel('qwen-qwen3.8-27b:free');
    assert.ok(wire && upstream && bare);
    assert.equal(wire.upstreamId, upstream.upstreamId);
    assert.equal(bare.upstreamId, upstream.upstreamId);
    assert.equal(await resolveLiveModel('minerva/not-a-model'), null);
    assert.equal(await resolveLiveModel(''), null);
    assert.equal(await resolveLiveModel(null), null);
  } finally {
    restore();
  }
});

test('unreachable upstream resolves to null so callers serve the pinned catalog', async () => {
  globalThis.fetch = (async () => {
    throw new Error('boom');
  }) as typeof fetch;
  try {
    process.env.MINERVA_MODELS_TTL_SECONDS = '3600';
    assert.equal(await liveCatalog(), null);
    assert.equal(await liveModelsForTier(true), null);
    assert.equal(await resolveLiveModel('minerva/openrouter-free'), null);
    assert.equal(await liveFreeWireIds(), null);
  } finally {
    restore();
  }
});

test('non-OK and empty payloads are failures, not empty catalogs', async () => {
  stubFetch({ data: [] });
  try {
    process.env.MINERVA_MODELS_TTL_SECONDS = '3600';
    assert.equal(await liveCatalog(), null);
  } finally {
    restore();
  }
  stubFetch({ data: [] }, false);
  try {
    process.env.MINERVA_MODELS_TTL_SECONDS = '3600';
    assert.equal(await liveCatalog(), null);
  } finally {
    restore();
  }
});

test('stale cache serves immediately while a background refresh runs', async () => {
  const realNow = Date.now;
  let now = 1_000_000;
  (Date as { now: () => number }).now = () => now;
  const calls = stubFetch(upstreamList());
  try {
    process.env.MINERVA_MODELS_TTL_SECONDS = '3600';
    const first = await liveCatalog();
    assert.ok(first);
    assert.equal(calls(), 1);
    // Age past the TTL: the stale list serves at once, refresh in background.
    now += 3601 * 1000;
    const stale = await liveCatalog();
    assert.deepEqual(stale, first);
    await new Promise((r) => setTimeout(r, 50));
    assert.equal(calls(), 2);
    // Refreshed cache is fresh again: no further fetch.
    const fresh = await liveCatalog();
    assert.ok(fresh);
    assert.equal(calls(), 2);
  } finally {
    (Date as { now: () => number }).now = realNow;
    restore();
  }
});
