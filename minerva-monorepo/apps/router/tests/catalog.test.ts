import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CATALOG,
  DEFAULT_MODEL,
  FREE_MODELS,
  modelsForTier,
  resolveModel,
  toUpstreamId,
  toWireId,
} from '../src/catalog.js';

test('wire ID flattening is the documented rule from plan §9', () => {
  assert.equal(toWireId('anthropic/claude-opus-4.6'), 'minerva/anthropic-claude-opus-4.6');
});

test('wire -> upstream resolves through the catalog, not string surgery', () => {
  // A dash-based inverse would be ambiguous here; only the catalog lookup is correct.
  assert.equal(toUpstreamId('minerva/google-gemini-3.1-flash-lite'), 'google/gemini-3.1-flash-lite');
});

test('resolveModel accepts wire, upstream and prefixed-bare spellings', () => {
  const wire = resolveModel('minerva/anthropic-claude-opus-4.6');
  const upstream = resolveModel('anthropic/claude-opus-4.6');
  const bare = resolveModel('anthropic-claude-opus-4.6');
  assert.ok(wire && upstream && bare);
  assert.equal(wire.upstreamId, upstream.upstreamId);
  assert.equal(bare.upstreamId, upstream.upstreamId);
});

test('unknown models resolve to null so the router 400s instead of relaying upstream', () => {
  assert.equal(resolveModel('minerva/not-a-model'), null);
  assert.equal(resolveModel(''), null);
  assert.equal(resolveModel(null), null);
});

test('default and review models are pinned in the catalog', () => {
  assert.ok(resolveModel(DEFAULT_MODEL), 'DEFAULT_MODEL must be in the catalog');
  assert.ok(resolveModel('google/gemini-3.1-pro-preview'), 'REVIEW_MODEL must be in the catalog');
});

test('free tier sees only free models; paid tier sees everything', () => {
  const free = modelsForTier(false);
  const paid = modelsForTier(true);
  assert.ok(free.length > 0, 'free tier must have at least one usable model');
  assert.ok(free.every((e) => e.free), 'free tier must never expose a priced model');
  assert.ok(paid.length > free.length, 'paid tier is a superset');
  assert.equal(free.length, FREE_MODELS.length);
});

test('every catalog entry has a unique wire ID and non-negative price', () => {
  const wires = new Set(CATALOG.map((e) => e.wireId));
  assert.equal(wires.size, CATALOG.length, 'duplicate wire ID');
  for (const e of CATALOG) {
    assert.ok(e.promptPer1M >= 0 && e.completionPer1M >= 0, `negative price for ${e.upstreamId}`);
    assert.ok(e.contextWindow > 0, `missing context window for ${e.upstreamId}`);
  }
});
