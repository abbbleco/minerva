import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveModel, type CatalogEntry } from '../src/catalog.js';
import { chatCostUsd, embeddingCostUsd, roundUsd, toCredits } from '../src/pricing.js';

const opus = resolveModel('minerva/anthropic-claude-opus-4.6') as CatalogEntry;

test('chat cost matches the pinned catalog price', () => {
  // 1M in @ $5 + 1M out @ $25 = $30
  assert.equal(chatCostUsd(opus, { promptTokens: 1_000_000, completionTokens: 1_000_000 }), 30);
});

test('a typical PRD-scale call lands where the cost model says it should', () => {
  // 4 calls of 18k in / 4k out = 72k in, 16k out -> $0.36 + $0.40
  const cost = chatCostUsd(opus, { promptTokens: 72_000, completionTokens: 16_000 });
  assert.ok(Math.abs(cost - 0.76) < 0.001, `expected ~0.76, got ${cost}`);
});

test('free models cost nothing', () => {
  const freeEntry = resolveModel('qwen/qwen3.8-27b:free') as CatalogEntry;
  assert.equal(chatCostUsd(freeEntry, { promptTokens: 1_000_000, completionTokens: 1_000_000 }), 0);
});

test('negative token counts clamp to zero rather than crediting the tenant', () => {
  assert.equal(chatCostUsd(opus, { promptTokens: -100, completionTokens: -100 }), 0);
});

test('embeddings are billed at the Vertex rate', () => {
  assert.equal(embeddingCostUsd(1_000_000), 0.02);
});

test('rounding is to 1e-6 USD, not to cents', () => {
  // Sub-cent calls must still be recorded accurately or monthly recon drifts beyond ±1%.
  assert.equal(roundUsd(0.0001234567), 0.000123);
});

test('the billing multiplier converts subscription dollars to credits', () => {
  assert.equal(toCredits(49, 0.7), 34.3);
  assert.equal(toCredits(200, 0.7), 140);
});
