import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";

import {
  classifyWebhookEvent,
  computeGrant,
  nextPeriodEnd,
  parsePaidTier,
  pricedTier,
  tierForAmountCents,
  verifyWebhookSignature,
} from "../app/lib/paystack.js";
import { findMatchingPlan, planSpecForTier } from "../scripts/create-paystack-plans.js";

const savedFetch = globalThis.fetch;
const savedSecret = process.env.PAYSTACK_SECRET_KEY;

function restore() {
  globalThis.fetch = savedFetch;
  if (savedSecret === undefined) delete process.env.PAYSTACK_SECRET_KEY;
  else process.env.PAYSTACK_SECRET_KEY = savedSecret;
}

function stubPaystack(body: unknown, ok = true) {
  globalThis.fetch = (async () =>
    ({ ok, json: async () => body }) as Response) as typeof fetch;
}

test("tier parsing is strict: plus/super/ultra only", () => {
  assert.equal(parsePaidTier(" Plus "), "plus");
  assert.equal(parsePaidTier("SUPER"), "super");
  assert.equal(parsePaidTier("ultra"), "ultra");
  assert.equal(parsePaidTier("free"), null);
  assert.equal(parsePaidTier("agency"), null);
  assert.equal(parsePaidTier("pro"), null);
  assert.equal(parsePaidTier(""), null);
  assert.equal(parsePaidTier(42), null);
  assert.equal(parsePaidTier(null), null);
});

test("verified amounts identify their tier; unknown amounts identify nothing", () => {
  assert.equal(tierForAmountCents(35000), "plus");
  assert.equal(tierForAmountCents(165000), "super");
  assert.equal(tierForAmountCents(350000), "ultra");
  assert.equal(tierForAmountCents(2000), null);
  assert.equal(tierForAmountCents(0), null);
});

test("grants never exceed cap headroom and never go negative", () => {
  assert.equal(computeGrant(0, 22, 10), 10);
  assert.equal(computeGrant(5, 22, 10), 5);
  assert.equal(computeGrant(15, 22, 10), 0);
  assert.equal(computeGrant(0, 110, 50), 50);
  assert.equal(computeGrant(-3, 22, 10), 10);
  assert.equal(computeGrant(0, 0, 10), 0);
});

test("periods extend one month from the later of now and the current end", () => {
  assert.equal(nextPeriodEnd(null, "2026-10-07T00:00:00.000Z"), "2026-11-07T00:00:00.000Z");
  assert.equal(
    nextPeriodEnd("2026-12-01T00:00:00.000Z", "2026-10-07T00:00:00.000Z"),
    "2027-01-01T00:00:00.000Z"
  );
  assert.equal(
    nextPeriodEnd("2026-09-01T00:00:00.000Z", "2026-10-07T00:00:00.000Z"),
    "2026-11-07T00:00:00.000Z"
  );
});

test("webhook HMAC accepts the true digest and nothing else", () => {
  process.env.PAYSTACK_SECRET_KEY = "sk_test_vector";
  try {
    const body = '{"event":"charge.success"}';
    const good = createHmac("sha512", "sk_test_vector").update(body, "utf8").digest("hex");
    assert.equal(verifyWebhookSignature(body, good), true);
    assert.equal(verifyWebhookSignature(body, `${good.slice(0, -1)}0`), false);
    assert.equal(verifyWebhookSignature(`${body} `, good), false);
    assert.equal(verifyWebhookSignature(body, null), false);
    assert.equal(verifyWebhookSignature(body, ""), false);
  } finally {
    restore();
  }
});

test("webhook verification fails closed without a secret", () => {
  delete process.env.PAYSTACK_SECRET_KEY;
  try {
    assert.equal(verifyWebhookSignature("{}", "ab".repeat(64)), false);
  } finally {
    restore();
  }
});

test("events route to fulfillment kinds; everything else is ignored", () => {
  assert.equal(classifyWebhookEvent("charge.success"), "subscription_payment");
  assert.equal(classifyWebhookEvent("subscription.create"), "subscription_created");
  assert.equal(classifyWebhookEvent("subscription.disable"), "subscription_disabled");
  assert.equal(classifyWebhookEvent("subscription.not_renew"), "subscription_not_renewing");
  assert.equal(classifyWebhookEvent("invoice.payment_failed"), "payment_failed");
  assert.equal(classifyWebhookEvent("invoice.create"), "ignore");
  assert.equal(classifyWebhookEvent("invoice.update"), "ignore");
  assert.equal(classifyWebhookEvent("subscription.expiring_cards"), "ignore");
  assert.equal(classifyWebhookEvent("transfer.success"), "ignore");
  assert.equal(classifyWebhookEvent(undefined), "ignore");
  assert.equal(classifyWebhookEvent(null), "ignore");
});

test("pricedTier refuses dashboard/catalog price drift", async () => {
  process.env.PAYSTACK_SECRET_KEY = "sk_test_x";
  process.env.PAYSTACK_PLAN_PLUS = "PLN_plus";
  try {
    stubPaystack({ status: true, data: { plan_code: "PLN_plus", amount: 35000, currency: "ZAR", interval: "monthly" } });
    const priced = await pricedTier("plus");
    assert.deepEqual(priced, { amount: 35000, currency: "ZAR", planCode: "PLN_plus" });
  } finally {
    restore();
  }
  process.env.PAYSTACK_SECRET_KEY = "sk_test_x";
  process.env.PAYSTACK_PLAN_PLUS = "PLN_plus";
  try {
    stubPaystack({ status: true, data: { plan_code: "PLN_plus", amount: 36000, currency: "ZAR", interval: "monthly" } });
    await assert.rejects(() => pricedTier("plus"), /prices 36000.*but 35000|but 35000.*36000/);
  } finally {
    restore();
  }
  process.env.PAYSTACK_SECRET_KEY = "sk_test_x";
  process.env.PAYSTACK_PLAN_PLUS = "PLN_plus";
  try {
    stubPaystack({ status: true, data: { plan_code: "PLN_plus", amount: 35000, currency: "NGN", interval: "monthly" } });
    await assert.rejects(() => pricedTier("plus"), /NGN/);
  } finally {
    restore();
  }
});

test("plan specs come from the billing package; matching is exact on all four fields", () => {
  const savedCurrency = process.env.BILLING_CURRENCY;
  const savedRate = process.env.BILLING_ZAR_PER_USD;
  delete process.env.BILLING_CURRENCY;
  delete process.env.BILLING_ZAR_PER_USD;
  try {
    assert.deepEqual(planSpecForTier("plus"), {
    name: "Minerva Plus",
    amount: 35000,
    currency: "ZAR",
    interval: "monthly",
  });
  assert.deepEqual(planSpecForTier("ultra"), {
    name: "Minerva Ultra",
    amount: 350000,
    currency: "ZAR",
    interval: "monthly",
  });
  // The provisioning script shares the same contract as the checkout path.
  assert.deepEqual(planSpecForTier("super"), {
    name: "Minerva Super",
    amount: 165000,
    currency: "ZAR",
    interval: "monthly",
  });
  const existing = [
    { plan_code: "PLN_a", name: "Minerva Plus", amount: 35000, currency: "ZAR", interval: "monthly" },
    { plan_code: "PLN_b", name: "Minerva Plus", amount: 35000, currency: "ZAR", interval: "yearly" },
  ];
  assert.equal(findMatchingPlan(existing, planSpecForTier("plus"))?.plan_code, "PLN_a");
  assert.equal(
    findMatchingPlan(existing, { name: "Minerva Plus", amount: 35000, currency: "ZAR", interval: "monthly" })?.plan_code,
    "PLN_a"
  );
  assert.equal(findMatchingPlan([], planSpecForTier("plus")), null);
  } finally {
    if (savedCurrency === undefined) delete process.env.BILLING_CURRENCY;
    else process.env.BILLING_CURRENCY = savedCurrency;
    if (savedRate === undefined) delete process.env.BILLING_ZAR_PER_USD;
    else process.env.BILLING_ZAR_PER_USD = savedRate;
  }
});
