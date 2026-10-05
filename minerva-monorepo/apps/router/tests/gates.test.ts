import assert from 'node:assert/strict';
import { test } from 'node:test';

import { FREE_MODELS, resolveModel, type CatalogEntry } from '../src/catalog.js';
import { evaluateGates, type GateInput } from '../src/gates.js';

const opus = resolveModel('minerva/anthropic-claude-opus-4.6') as CatalogEntry;
const freeModel = resolveModel(FREE_MODELS[0] ?? '') as CatalogEntry;

/** Paid, healthy tenant. Gates should pass unless something is positively wrong. */
function base(overrides: Partial<GateInput> = {}): GateInput {
  return {
    billingState: 'active',
    plan: 'plus',
    balanceUsd: 10,
    quota: { used: 1, limit: 100 },
    model: opus,
    ...overrides,
  };
}

test('healthy paid tenant passes', () => {
  assert.equal(evaluateGates(base(), FREE_MODELS), null);
});

test('past_due and expired are denied before anything else', () => {
  for (const state of ['past_due', 'expired'] as const) {
    const d = evaluateGates(base({ billingState: state }), FREE_MODELS);
    assert.equal(d?.code, 'billing_required');
    assert.equal(d?.status, 402);
  }
});

test('billing is checked before credits, so an expired tenant never sees a credit error', () => {
  const d = evaluateGates(base({ billingState: 'expired', balanceUsd: 0 }), FREE_MODELS);
  assert.equal(d?.code, 'billing_required');
});

test('free plan requesting a priced model is denied with the allowed list', () => {
  const d = evaluateGates(base({ plan: 'free', model: opus }), FREE_MODELS);
  assert.equal(d?.code, 'upgrade_required');
  assert.deepEqual(d?.allowedModels, [...FREE_MODELS]);
});

test('free plan requesting a free model passes', () => {
  assert.equal(evaluateGates(base({ plan: 'free', model: freeModel }), FREE_MODELS), null);
});

test('a zero or negative balance is denied', () => {
  for (const balance of [0, -1]) {
    const d = evaluateGates(base({ balanceUsd: balance }), FREE_MODELS);
    assert.equal(d?.code, 'credits_exhausted');
  }
});

test('an exhausted quota is denied', () => {
  const d = evaluateGates(base({ quota: { used: 100, limit: 100 } }), FREE_MODELS);
  assert.equal(d?.code, 'quota_exceeded');
});

test('unknown model is a 400, not a 402', () => {
  const d = evaluateGates(base({ model: null }), FREE_MODELS);
  assert.equal(d?.code, 'unknown_model');
  assert.equal(d?.status, 400);
});

// ── Fail-open contract (plan §3.4.2, rev.4 C5) ─────────────────────────────
// A failed read must never fabricate a denial: a false 402 is an outage for every tenant
// at once, whereas a missed debit is a finance ticket.

test('FAIL-OPEN: an unreadable balance does not deny', () => {
  assert.equal(evaluateGates(base({ balanceUsd: null }), FREE_MODELS), null);
});

test('FAIL-OPEN: an unreadable quota does not deny', () => {
  assert.equal(evaluateGates(base({ quota: null }), FREE_MODELS), null);
});

test('FAIL-OPEN: every dependency read failing still serves the request', () => {
  assert.equal(evaluateGates(base({ balanceUsd: null, quota: null }), FREE_MODELS), null);
});

test('FAIL-OPEN does not extend to billing state, which is read from the subscription row', () => {
  // Billing state is authoritative once read; only unknown/missing reads fail open.
  assert.equal(evaluateGates(base({ billingState: 'past_due', balanceUsd: null }), FREE_MODELS)?.code, 'billing_required');
});

// ---------------------------------------------------------------------------
// Free models must be reachable at zero balance
// ---------------------------------------------------------------------------

test('a FREE model is not blocked by a zero balance', () => {
  // Regression: the credits gate used to fire on balance <= 0 regardless of model cost, which
  // made the free tier unusable at exactly zero — the opposite of its purpose. Found by the
  // first live e2e run (free chat returned credits_exhausted), not by review.
  assert.equal(evaluateGates(base({ plan: 'free', balanceUsd: 0, model: freeModel }), FREE_MODELS), null);
});

test('a negative balance does not block a free model either', () => {
  assert.equal(evaluateGates(base({ plan: 'free', balanceUsd: -3.5, model: freeModel }), FREE_MODELS), null);
});

test('a PAID model is still blocked by a zero balance', () => {
  // The guard must be scoped to free models only — an empty balance still stops paid spend.
  const d = evaluateGates(base({ balanceUsd: 0, model: opus }), FREE_MODELS);
  assert.equal(d?.code, 'credits_exhausted');
});
