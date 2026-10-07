/**
 * Paystack subscription billing — the only payment gateway.
 *
 * Tiers bill in USD (`@minerva/billing` is the single source of truth for
 * price/credits/rollover; dashboard plan codes must price-match or checkout
 * refuses). Flow per Paystack's subscription contract:
 *
 *   1. checkout initializes a plan-attached transaction (first payment);
 *   2. Paystack auto-creates the subscription → `subscription.create`;
 *   3. every cycle (first + renewals) lands as `charge.success`;
 *   4. renewals are preceded by `invoice.create`; failures arrive as
 *      `invoice.payment_failed`; cancellations as `subscription.disable`.
 *
 * Money rules: the webhook never trusts event payload amounts — every
 * fulfillment re-reads ground truth from `verifyTransaction` and matches the
 * local invoice row. Replays are harmless (reference idempotency).
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import { creditsForPlan, paidPlan, planCurrency, rolloverCapForPlan } from "@minerva/billing";

export type PaidTier = "plus" | "super" | "ultra";

const PAYSTACK_API = "https://api.paystack.co";
/** Charge currency follows the billing package (ZAR) — amounts match by construction. */
export function billingCurrency(): string {
  return planCurrency().toUpperCase();
}

export class PaystackError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "PaystackError";
    this.status = status;
  }
}

export function paystackSecret(): string {
  const key = (process.env.PAYSTACK_SECRET_KEY ?? "").trim();
  if (!key) throw new PaystackError("payments are not configured on this deploy", 503);
  return key;
}

/** Live vs test, for logs only — key material never reaches logs or errors. */
export function paystackMode(): "live" | "test" | "unconfigured" {
  const key = (process.env.PAYSTACK_SECRET_KEY ?? "").trim();
  if (!key) return "unconfigured";
  return key.startsWith("sk_live_") ? "live" : "test";
}

const PLAN_CODE_ENV: Record<PaidTier, string> = {
  plus: "PAYSTACK_PLAN_PLUS",
  super: "PAYSTACK_PLAN_SUPER",
  ultra: "PAYSTACK_PLAN_ULTRA",
};

export function planCodeForTier(tier: PaidTier): string {
  const code = (process.env[PLAN_CODE_ENV[tier]] ?? "").trim();
  if (!code) throw new PaystackError(`no Paystack plan configured for ${tier}`, 503);
  return code;
}

export function isPaidTier(value: unknown): value is PaidTier {
  return value === "plus" || value === "super" || value === "ultra";
}

/** Guarded tier parse for request input (agency is legacy, free is not bought). */
export function parsePaidTier(value: unknown): PaidTier | null {
  if (typeof value !== "string") return null;
  const tier = value.trim().toLowerCase();
  return isPaidTier(tier) ? tier : null;
}

async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const secret = paystackSecret();
  let res: Response;
  try {
    res = await fetch(`${PAYSTACK_API}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        authorization: `Bearer ${secret}`,
        "content-type": "application/json",
      },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    throw new PaystackError(`Paystack unreachable: ${err instanceof Error ? err.message : err}`);
  }
  const json = (await res.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: T;
  } | null;
  if (!res.ok || !json || json.status !== true) {
    throw new PaystackError(json?.message ?? `Paystack request failed (${res.status})`, res.status >= 500 ? 502 : 500);
  }
  return json.data as T;
}

export interface PaystackPlan {
  plan_code: string;
  amount: number;
  currency: string;
  interval: string;
}

export interface PaystackCustomer {
  customer_code: string;
  email: string;
}

export interface PaystackInit {
  authorization_url: string;
  reference: string;
}

export interface PaystackVerified {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  customer_code: string | null;
  email: string | null;
  metadata: Record<string, unknown>;
  authorization_code: string | null;
}

export async function fetchPlan(code: string): Promise<PaystackPlan> {
  return api<PaystackPlan>(`/plan/${encodeURIComponent(code)}`);
}

/**
 * Amount (minor units) + currency for a tier, cross-checked three ways:
 * package price, dashboard plan price, dashboard currency. A plan-code/price
 * mismatch means someone edited one side without the other — refuse rather
 * than charge the wrong amount.
 */
export async function pricedTier(tier: PaidTier): Promise<{ amount: number; currency: string; planCode: string }> {
  const expected = paidPlan(tier).amountCents;
  const planCode = planCodeForTier(tier);
  const plan = await fetchPlan(planCode);
  if (plan.amount !== expected) {
    throw new PaystackError(
      `plan ${tier} prices ${plan.amount} on the dashboard but ${expected} here — fix the plan code or the catalog`,
      500
    );
  }
  if (String(plan.currency ?? "").toUpperCase() !== billingCurrency()) {
    throw new PaystackError(`plan ${tier} bills in ${plan.currency}, expected ${billingCurrency()}`, 500);
  }
  return { amount: expected, currency: billingCurrency(), planCode };
}

export async function ensureCustomer(email: string, agencyId: string): Promise<PaystackCustomer> {
  const clean = email.trim().toLowerCase();
  try {
    const found = await api<{ customer_code: string; email: string }>(
      `/customer/${encodeURIComponent(clean)}`
    );
    if (found?.customer_code) return { customer_code: found.customer_code, email: found.email ?? clean };
  } catch {
    // Fall through to create (missing customer and transport failure look the
    // same here; create dedupes by email server-side on the retry path).
  }
  const created = await api<{ customer_code: string; email: string }>("/customer", {
    method: "POST",
    body: { email: clean, metadata: { agency_id: agencyId } },
  });
  return { customer_code: created.customer_code, email: created.email ?? clean };
}

export interface InitSubscriptionPayment {
  email: string;
  tier: PaidTier;
  agencyId: string;
  callbackUrl: string;
}

export async function initializeSubscriptionPayment(opts: InitSubscriptionPayment): Promise<PaystackInit> {
  const { amount, currency, planCode } = await pricedTier(opts.tier);
  const data = await api<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: {
      email: opts.email.trim().toLowerCase(),
      amount,
      currency,
      plan: planCode,
      callback_url: opts.callbackUrl,
      metadata: { agency_id: opts.agencyId, plan: opts.tier, kind: "subscription_initial" },
    },
  });
  return { authorization_url: data.authorization_url, reference: data.reference };
}

export async function verifyTransaction(reference: string): Promise<PaystackVerified> {
  const data = await api<{
    reference: string;
    status: string;
    amount: number;
    currency: string;
    paid_at?: string | null;
    customer?: { customer_code?: string; email?: string } | null;
    metadata?: Record<string, unknown> | null;
    authorization?: { authorization_code?: string } | null;
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);
  return {
    reference: data.reference,
    status: data.status,
    amount: data.amount,
    currency: data.currency,
    paid_at: data.paid_at ?? null,
    customer_code: data.customer?.customer_code ?? null,
    email: data.customer?.email ?? null,
    metadata: (data.metadata ?? {}) as Record<string, unknown>,
    authorization_code: data.authorization?.authorization_code ?? null,
  };
}

export async function disableSubscription(code: string, token: string): Promise<void> {
  await api("/subscription/disable", { method: "POST", body: { code, token } });
}

/**
 * HMAC-SHA512 of the raw body vs `x-paystack-signature` (hex). Length-checked
 * before the timing-safe compare. Webhooks carry no timestamp, so replays are
 * possible — every fulfillment is reference-idempotent, which is what makes a
 * replayed body harmless.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  let secret: string;
  try {
    secret = paystackSecret();
  } catch {
    return false;
  }
  const digest = createHmac("sha512", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(signature.trim(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export type WebhookKind =
  | "subscription_payment"
  | "subscription_created"
  | "subscription_disabled"
  | "subscription_not_renewing"
  | "payment_failed"
  | "ignore";

/** Pure event router: name → fulfillment kind. Payload interpretation lives in the route. */
export function classifyWebhookEvent(event: unknown): WebhookKind {
  switch (event) {
    case "charge.success":
      return "subscription_payment";
    case "subscription.create":
      return "subscription_created";
    case "subscription.disable":
      return "subscription_disabled";
    case "subscription.not_renew":
      return "subscription_not_renewing";
    case "invoice.payment_failed":
      return "payment_failed";
    default:
      return "ignore";
  }
}

/**
 * Credit grant for a paid cycle, honoring the rollover cap: the balance never
 * exceeds the cap after the grant. All inputs are plain numbers (USD).
 */
export function computeGrant(balanceUsd: number, monthlyCredits: number, rolloverCap: number): number {
  const headroom = Math.max(0, rolloverCap - Math.max(0, balanceUsd));
  return Math.min(Math.max(0, monthlyCredits), headroom);
}

/** Grant inputs for a tier from the billing package (single source of truth). */
export function grantForPlan(tier: PaidTier): { credits: number; cap: number } {
  return { credits: creditsForPlan(tier), cap: rolloverCapForPlan(tier) };
}

/**
 * Tier for a minor-units amount, or null. Plan prices are unique per tier, so
 * a verified charge amount identifies its tier without trusting metadata —
 * the webhook resolves initial purchases this way.
 */
export function tierForAmountCents(amount: number): PaidTier | null {
  for (const tier of ["plus", "super", "ultra"] as const) {
    if (paidPlan(tier).amountCents === amount) return tier;
  }
  return null;
}

/** Next cycle end: one calendar month after the later of now and the current end. */
export function nextPeriodEnd(currentEndIso: string | null, nowIso?: string): string {
  const now = (nowIso ? new Date(nowIso) : new Date()).getTime();
  const current = currentEndIso ? new Date(currentEndIso).getTime() : NaN;
  const base = Number.isFinite(current) && current > now ? current : now;
  const end = new Date(base);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return end.toISOString();
}
