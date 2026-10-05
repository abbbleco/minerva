import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  creditsForPlan,
  isPaidPlanId,
  isPlanId,
  LEGACY_PAID_PLAN_IDS,
  modelsForPlan,
  paidPlan,
  PAID_PLAN_IDS,
  quotasForPlan,
  rolloverCapForPlan,
} from '@minerva/billing';
import { evaluateGates, type GateInput } from '../src/gates.js';
import { FREE_MODELS, resolveModel, type CatalogEntry } from '../src/catalog.js';

// Pin the env so tier figures are deterministic: every figure below is the documented
// default, and an operator override must not silently rewrite what the suite asserts.
for (const key of [
  'BILLING_PLUS_AMOUNT_CENTS',
  'BILLING_SUPER_AMOUNT_CENTS',
  'BILLING_ULTRA_AMOUNT_CENTS',
  'BILLING_AGENCY_AMOUNT_CENTS',
  'BILLING_PORTAL_BONUS_MULTIPLIER',
  'BILLING_CREDIT_MULTIPLIER',
  'BILLING_ROLLOVER_CAP_PLUS_USD',
  'BILLING_ROLLOVER_CAP_SUPER_USD',
  'BILLING_ROLLOVER_CAP_ULTRA_USD',
  'BILLING_ROLLOVER_CAP_AGENCY_USD',
  'MINERVA_FREE_CREDITS_USD',
  'BILLING_CURRENCY',
]) {
  delete process.env[key];
}

test('canonical paid tiers are plus/super/ultra; legacy agency stays readable, pro is gone', () => {
  assert.deepEqual([...PAID_PLAN_IDS], ['plus', 'super', 'ultra']);
  assert.deepEqual([...LEGACY_PAID_PLAN_IDS], ['agency']);
  for (const id of ['plus', 'super', 'ultra', 'agency']) {
    assert.equal(isPaidPlanId(id), true);
    assert.equal(isPlanId(id), true);
  }
  assert.equal(isPaidPlanId('free'), false);
  assert.equal(isPaidPlanId('pro'), false);
  assert.equal(isPlanId('pro'), false);
  assert.equal(isPlanId('bogus'), false);
});

test('portal prices are the pricing.png figures in USD', () => {
  assert.equal(paidPlan('plus').amountCents, 2000);
  assert.equal(paidPlan('super').amountCents, 10000);
  assert.equal(paidPlan('ultra').amountCents, 20000);
  for (const id of ['plus', 'super', 'ultra'] as const) {
    assert.equal(paidPlan(id).currency, 'usd');
  }
});

test('portal credit grants are price x 10% bonus: 22/110/220', () => {
  assert.equal(creditsForPlan('plus'), 22);
  assert.equal(creditsForPlan('super'), 110);
  assert.equal(creditsForPlan('ultra'), 220);
  assert.ok(creditsForPlan('ultra') > creditsForPlan('super'));
  assert.ok(creditsForPlan('super') > creditsForPlan('plus'));
});

test('portal rollover caps are 10/50/100; free carries nothing', () => {
  assert.equal(rolloverCapForPlan('free'), 0);
  assert.equal(rolloverCapForPlan('plus'), 10);
  assert.equal(rolloverCapForPlan('super'), 50);
  assert.equal(rolloverCapForPlan('ultra'), 100);
});

test('legacy agency keeps its ZAR price, grant and cap', () => {
  assert.equal(paidPlan('agency').amountCents, 350000);
  // R3,500 at 16.39 ZAR/USD with the 0.7 margin floor — not the portal bonus.
  assert.equal(creditsForPlan('agency'), 149.48);
  assert.equal(rolloverCapForPlan('agency'), 50);
});

test('every paid tier — portal or legacy — unlocks the full catalog without quotas', () => {
  for (const id of ['plus', 'super', 'ultra', 'agency'] as const) {
    assert.ok(modelsForPlan(id).includes('*'));
    assert.equal(quotasForPlan(id).briefsPerMonth, Number.MAX_SAFE_INTEGER);
  }
  assert.ok(!modelsForPlan('free').includes('*'));
});

test('router gates treat each portal tier as paid: priced model passes with balance', () => {
  const opus = resolveModel('minerva/anthropic-claude-opus-4.6') as CatalogEntry;
  for (const plan of ['plus', 'super', 'ultra'] as const) {
    const input: GateInput = {
      billingState: 'active',
      plan,
      balanceUsd: 10,
      quota: null,
      model: opus,
    };
    assert.equal(evaluateGates(input, FREE_MODELS), null);
  }
});
