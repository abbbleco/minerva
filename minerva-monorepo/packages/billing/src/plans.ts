/**
 * Plan catalog, credit maths and model-tier rules — shared by `apps/web` and `apps/router`.
 *
 * Extracted from `apps/web/lib/billing.ts` because the router must gate on EXACTLY the same
 * numbers the portal grants. Two copies of "what does the super plan include" is precisely the
 * kind of drift that makes a customer's balance disagree with their invoice.
 *
 * Everything here is pure: no I/O, no Supabase, no clock beyond `Date`. The Supabase-backed
 * halves (entitlement resolution, ledger writes) stay in each app.
 */

export type BillingState = "active" | "free" | "past_due" | "expired";

/**
 * Canonical portal tiers, billed in ZAR (Paystack is the only gateway):
 * FREE R0 / PLUS R350 / SUPER R1,650 / ULTRA R3,500.
 */
export type PlanId = "free" | "plus" | "super" | "ultra" | "agency";
/** Tiers new subscriptions are issued on. */
export type PortalPlanId = "plus" | "super" | "ultra";
/**
 * Pre-portal tier, still live on old subscription rows: Agency billed in `planCurrency()`
 * (ZAR R3,500 after the 16.39 conversion). Accepted everywhere a plan is read and
 * granted/gated like any paid tier; never issued to new subscriptions.
 */
export type LegacyPlanId = "agency";
export type PaidPlanId = PortalPlanId | LegacyPlanId;

export interface CreditState {
  /** USD, cached counter `agencies.credits_balance_usd`. */
  balance: number;
  /** USD granted this period. */
  included: number;
  /** USD spent this period, from the ledger. */
  used: number;
  resetAt: string | null;
}

export interface QuotaState {
  briefsPerMonth: number;
  prdsPerMonth: number;
  aiTokensPerMonth: number;
  pipelineRunsPerMonth: number;
}

export interface AgencyBilling {
  state: BillingState;
  plan: PlanId;
  credits: CreditState;
  quotas: QuotaState;
  models: { allowed: string[] };
}

export interface PaidPlan {
  id: PaidPlanId;
  name: string;
  amountCents: number;
  /** ISO currency of `amountCents` — every tier is denominated in `planCurrency()`. */
  currency: string;
}

/** Tiers new subscriptions are issued on. Legacy `agency` stays readable, never issued. */
export const PAID_PLAN_IDS: PortalPlanId[] = ["plus", "super", "ultra"];
export const LEGACY_PAID_PLAN_IDS: LegacyPlanId[] = ["agency"];

export function envNumber(key: string, fallback: number): number {
  const raw = Number(process.env[key]);
  return Number.isFinite(raw) && raw >= 0 ? raw : fallback;
}

/**
 * Tier prices, denominated in `planCurrency()` (ZAR by default).
 *
 * Portal tiers (canonical): PLUS R350 / SUPER R1,650 / ULTRA R3,500 — converted
 * from the original USD list ($20/$100/$200 at 16.39 ZAR/USD, 2026-09-30) and
 * ROUNDED UP to clean price points (owner decision, same precedent as the
 * legacy R3,500 agency tier). Rounding up absorbs FX drift and gateway fees
 * rather than silently eroding margin every time the rand weakens.
 *
 * Legacy tier (preserved for old rows): $200 x 16.39 = R3,278.00 -> R3,500.
 *
 * Credit grants are always USD (`creditsForPlan` converts), so a price in any
 * billing currency buys the same inference.
 */
export function paidPlan(id: PaidPlanId): PaidPlan {
  switch (id) {
    case "plus":
      return { id, name: "Plus", amountCents: envNumber("BILLING_PLUS_AMOUNT_CENTS", 35000), currency: planCurrency() };
    case "super":
      return { id, name: "Super", amountCents: envNumber("BILLING_SUPER_AMOUNT_CENTS", 165000), currency: planCurrency() };
    case "ultra":
      return { id, name: "Ultra", amountCents: envNumber("BILLING_ULTRA_AMOUNT_CENTS", 350000), currency: planCurrency() };
    case "agency":
      return { id, name: "Agency", amountCents: envNumber("BILLING_AGENCY_AMOUNT_CENTS", 350000), currency: planCurrency() };
  }
}

/**
 * Credits granted per USD of subscription. DECIDED as 0.7 — see QONTXT_V2_COST_MODEL.md §2.
 * At 1.0 the $49 tier swings from +64% to -71% margin depending on usage; 0.7 puts a ~30%
 * floor under the worst case without changing the headline price.
 */
export function creditMultiplier(): number {
  const raw = Number(process.env.BILLING_CREDIT_MULTIPLIER);
  return Number.isFinite(raw) && raw > 0 ? raw : 0.7;
}

/**
 * Billing currency. Defaults to **ZAR** (owner decision 2026-09-30): Paystack is the only
 * gateway and is Africa-first, and v1's `payments.currency` defaulted to ZAR too.
 *
 * Tier amounts (`BILLING_*_AMOUNT_CENTS`) are denominated in THIS currency —
 * R350 is not $350. `creditsForPlan` converts to USD grants; review amounts
 * before taking money.
 */
export function planCurrency(): string {
  return (process.env.BILLING_CURRENCY ?? "zar").toLowerCase();
}

/**
 * Portal bonus: credits granted per unit of portal-tier subscription price. The
 * "10% BONUS" badge on pricing — R350 → ~$23.49, R1,650 → ~$110.74,
 * R3,500 → ~$234.90 (at 16.39 ZAR/USD).
 * Distinct from `creditMultiplier()` (0.7 margin floor on the legacy tier).
 */
export function portalBonusMultiplier(): number {
  const raw = Number(process.env.BILLING_PORTAL_BONUS_MULTIPLIER);
  return Number.isFinite(raw) && raw > 0 ? raw : 1.1;
}

export function isPaidPlanId(value: unknown): value is PaidPlanId {
  return (
    value === "plus" ||
    value === "super" ||
    value === "ultra" ||
    value === "agency"
  );
}

export function isPlanId(value: unknown): value is PlanId {
  return value === "free" || isPaidPlanId(value);
}

/**
 * ZAR per 1 USD — used to convert a local-currency price into the USD credits it buys.
 *
 * Override with `BILLING_ZAR_PER_USD` when the rate moves; the default is the mid-market rate
 * captured 2026-09-30 (16.39, sources 16.3834 / 16.3986).
 */
export function zarPerUsd(): number {
  const raw = Number(process.env.BILLING_ZAR_PER_USD);
  return Number.isFinite(raw) && raw > 0 ? raw : 16.39;
}

/** Multiplier converting one unit of the billing currency into USD. */
export function usdPerBillingUnit(): number {
  const currency = planCurrency();
  if (currency === "usd") return 1;
  if (currency === "zar") return 1 / zarPerUsd();
  // Any other currency has no defined conversion; treat as 1:1 and let the caller notice via
  // the resulting credit figure rather than silently inventing a rate.
  return 1;
}

/**
 * Credits granted for a plan, in **USD**.
 *
 * Credits are USD-denominated because model prices are USD (`QONTXT_V2_COST_MODEL.md`, the
 * router's `pricing.ts`). Every plan PRICE is in the billing currency, so each branch
 * converts to USD first — taking `amountCents / 100` directly would treat R350 as $350
 * and grant ~16x the intended inference. That is a revenue-destroying bug, not a
 * rounding error, which is why the conversion lives here rather than at the call site.
 *
 * Portal tiers grant price x bonus (R350 → ~$23.49 at 16.39 ZAR/USD); the legacy
 * tier grants price x margin floor (0.7). Free tier gets a flat monthly grant.
 */
export function creditsForPlan(plan: PlanId): number {
  if (plan === "free") return envNumber("MINERVA_FREE_CREDITS_USD", 5);
  if (plan === "plus" || plan === "super" || plan === "ultra") {
    const priceUsd = (paidPlan(plan).amountCents / 100) * usdPerBillingUnit();
    return round2(priceUsd * portalBonusMultiplier());
  }
  // Legacy tier: same conversion, margin floor instead of bonus.
  const priceInBillingCurrency = paidPlan(plan).amountCents / 100;
  const priceUsd = priceInBillingCurrency * usdPerBillingUnit();
  return round2(priceUsd * creditMultiplier());
}

/**
 * Max unused credits carried into the next period, USD. Portal caps from pricing.png
 * ($10/$50/$100); legacy agency keeps migration 030's global cap of $50.
 */
export function rolloverCapForPlan(plan: PlanId): number {
  switch (plan) {
    case "free":
      return 0;
    case "plus":
      return envNumber("BILLING_ROLLOVER_CAP_PLUS_USD", 10);
    case "super":
      return envNumber("BILLING_ROLLOVER_CAP_SUPER_USD", 50);
    case "ultra":
      return envNumber("BILLING_ROLLOVER_CAP_ULTRA_USD", 100);
    case "agency":
      return envNumber("BILLING_ROLLOVER_CAP_AGENCY_USD", 50);
  }
}

export function freeQuotas(): QuotaState {
  return {
    briefsPerMonth: envNumber("MINERVA_FREE_BRIEFS_PER_MO", 10),
    prdsPerMonth: envNumber("MINERVA_FREE_PRDS_PER_MO", 5),
    aiTokensPerMonth: envNumber("MINERVA_FREE_AI_TOKENS_PER_MO", 500_000),
    pipelineRunsPerMonth: envNumber("MINERVA_FREE_PIPELINE_RUNS_PER_MO", 50),
  };
}

/** Paid tiers are not quota-capped; their limit is the credit balance. */
export function quotasForPlan(plan: PlanId): QuotaState {
  if (plan === "free") return freeQuotas();
  const unbounded = Number.MAX_SAFE_INTEGER;
  return {
    briefsPerMonth: unbounded,
    prdsPerMonth: unbounded,
    aiTokensPerMonth: unbounded,
    pipelineRunsPerMonth: unbounded,
  };
}

/** Wire IDs the plan may use. Free tier is restricted to `MINERVA_FREE_MODELS`. */
export function modelsForPlan(plan: PlanId): string[] {
  const configured = (process.env.MINERVA_FREE_MODELS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const free = configured.length > 0 ? configured : ["minerva/qwen-qwen3.8-27b:free"];
  if (plan === "free") return free;
  // Paid plans may use the free models too; the full catalog is served by the router.
  return ["*", ...free];
}

/** Round to cents. Ledger rows use `round6` instead — see pricing.ts in the router. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Write paths gate on this: a lapsed subscription must not be able to spend. */
export function billingGated(billing: AgencyBilling): boolean {
  return billing.state === "expired" || billing.state === "past_due";
}

/**
 * Credits are spent. Distinct from `billingGated` because the router returns a different
 * 402 code (`credits_exhausted`) and the UI routes to top-up rather than a card update.
 */
export function creditsExhausted(billing: AgencyBilling): boolean {
  return billing.credits.balance <= 0;
}

/** Whether this plan may use a given wire model ID. */
export function modelTierAllowed(plan: PlanId, wireModelId: string): boolean {
  const allowed = modelsForPlan(plan);
  return allowed.includes("*") || allowed.includes(wireModelId);
}
