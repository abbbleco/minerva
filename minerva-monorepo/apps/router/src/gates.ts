/**
 * Pre-call gates. Pure: no I/O, no clock, no randomness — so the 402 matrix is unit-testable
 * and the stub router can script every branch without a database.
 *
 * FAIL-OPEN CONTRACT (plan §3.4.2, rev.4 C5)
 * ------------------------------------------
 * The router sits on the hot path of every inference call and exhaustion is a hard stop, so a
 * *false* 402 is worse than a *missed debit*: it is a simultaneous outage for every tenant,
 * while a missed debit is a finance ticket. Therefore a gate only denies when it positively
 * determines a violation. A `null` balance or quota means "the read failed" -> that gate is
 * skipped, and the request is served.
 */

import type { CatalogEntry } from './catalog.js';

export type BillingState = 'active' | 'free' | 'past_due' | 'expired';
// Mirrors PlanId in @minerva/billing: canonical portal tiers (plus/super/ultra) plus the
// legacy agency rows those gates still accept. Kept local so this module stays
// dependency-free; the only rule is `plan !== 'free'` means paid.
export type Plan = 'free' | 'plus' | 'super' | 'ultra' | 'agency';

export type QuotaReading = { used: number; limit: number };

export type GateInput = {
  billingState: BillingState;
  plan: Plan;
  /** USD. `null` = the balance read failed -> credits gate is skipped. */
  balanceUsd: number | null;
  /** `null` = the quota read failed -> quota gate is skipped. */
  quota: QuotaReading | null;
  /** Resolved catalog entry, or `null` when the model is unknown. */
  model: CatalogEntry | null;
};

export type DenialCode =
  | 'billing_required'
  | 'upgrade_required'
  | 'credits_exhausted'
  | 'quota_exceeded'
  | 'unknown_model';

export type Denial = {
  status: 402 | 400;
  code: DenialCode;
  message: string;
  /** Suggested wire IDs; present for `upgrade_required` and `unknown_model`. */
  allowedModels?: string[];
};

/**
 * Evaluate gates in plan order: billing -> model tier -> credits -> quota.
 * Returns `null` when the request may proceed.
 */
export function evaluateGates(input: GateInput, freeModels: readonly string[]): Denial | null {
  if (input.billingState === 'expired' || input.billingState === 'past_due') {
    return {
      status: 402,
      code: 'billing_required',
      message: `Subscription is ${input.billingState}. Update billing to continue.`,
    };
  }

  if (input.model === null) {
    return {
      status: 400,
      code: 'unknown_model',
      message: 'Model is not in the Minerva catalog.',
    };
  }

  const isPaid = input.plan !== 'free';
  if (!isPaid && !input.model.free) {
    return {
      status: 402,
      code: 'upgrade_required',
      message: `The free plan is limited to free models. "${input.model.wireId}" requires a paid plan.`,
      allowedModels: [...freeModels],
    };
  }

  // Fail-open: only a successful read of a non-positive balance denies.
  //
  // `!input.model.free` is load-bearing, not an optimisation. A free model costs $0, so an empty
  // balance cannot be "exhausted" by it. Without this guard the free tier is unusable at zero
  // balance — the exact opposite of its purpose — and every free-tier account that has not yet
  // been granted credits is locked out of models that would cost nothing.
  // Caught by the first real e2e run: /v1/chat/completions on a free model returned
  // `credits_exhausted` against a balance of 0.
  if (!input.model.free && input.balanceUsd !== null && input.balanceUsd <= 0) {
    return {
      status: 402,
      code: 'credits_exhausted',
      message: 'Inference credits exhausted. Top up or wait for the monthly grant.',
    };
  }

  // Fail-open: only a successful read of an exceeded quota denies.
  if (input.quota !== null && input.quota.used >= input.quota.limit) {
    return {
      status: 402,
      code: 'quota_exceeded',
      message: `Monthly quota reached (${input.quota.used}/${input.quota.limit}).`,
    };
  }

  return null;
}
