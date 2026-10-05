/**
 * Credit ledger writes for the router.
 *
 * Two rules govern everything here:
 *
 * 1. **Never break an inference call.** Metering is best-effort: if the ledger write fails we
 *    log and serve the response anyway (plan §3.4.2). The nightly `ledger Σ vs upstream invoice`
 *    reconciliation (±1%) is what catches drift — not a 500 in the customer's path.
 * 2. **Exactly one debit per logical request.** The `agency_credits_apply` RPC (migration 031)
 *    holds the idempotency guarantee via a partial unique index on `(agency_id, request_id)`.
 *    A retried request — or an SSE stream billed twice — returns `duplicate: true`, not an error.
 */

import { createServerClient } from "@minerva/database";

export interface DebitInput {
  agencyId: string;
  /** Positive USD cost; the ledger row is written as a negative amount. */
  costUsd: number;
  model: string;
  promptTokens: number;
  completionTokens: number;
  /** `hash(session_id, turn_index, model)` — the idempotency key. */
  requestId?: string;
}

export type DebitResult =
  | { ok: true; balanceAfter: number; duplicate: boolean }
  | { ok: false; reason: string };

/**
 * Debit inference cost. Never throws.
 *
 * A zero or negative cost is a no-op (free models cost nothing and must not write ledger rows —
 * otherwise the free tier would generate thousands of $0.00 rows for no reason).
 */
export async function debitInference(input: DebitInput): Promise<DebitResult> {
  if (!(input.costUsd > 0)) {
    return { ok: true, balanceAfter: 0, duplicate: false };
  }

  try {
    const client = createServerClient();
    const { data, error } = await client.rpc("agency_credits_apply", {
      p_agency_id: input.agencyId,
      // Negative: a debit.
      p_amount: -input.costUsd,
      p_kind: "inference",
      p_model: input.model,
      p_tokens: {
        prompt_tokens: input.promptTokens,
        completion_tokens: input.completionTokens,
      },
      p_request_id: input.requestId ?? null,
    });

    if (error) {
      console.error(`ledger debit failed (agency=${input.agencyId}): ${error.message}`);
      return { ok: false, reason: error.message };
    }

    const row = (Array.isArray(data) ? data[0] : data) as
      | { balance_after: number | string; duplicate: boolean }
      | null;

    return {
      ok: true,
      balanceAfter: Number(row?.balance_after ?? 0),
      duplicate: Boolean(row?.duplicate),
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`ledger debit crashed (agency=${input.agencyId}): ${reason}`);
    return { ok: false, reason };
  }
}

/** Current balance, or `null` when unreadable (callers must treat null as "unknown"). */
export async function readBalance(agencyId: string): Promise<number | null> {
  try {
    const client = createServerClient();
    const { data, error } = await client
      .from("agencies")
      .select("credits_balance_usd")
      .eq("id", agencyId)
      .maybeSingle();
    if (error) return null;
    const raw = (data as { credits_balance_usd?: number | string } | null)?.credits_balance_usd;
    const n = Number(raw ?? 0);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export interface LedgerHealth {
  ok: boolean;
  error?: string;
}

export interface CreditSummary {
  balance: number;
  usedThisMonth: number;
  resetAt: string;
}

function monthStart(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function nextMonthStart(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

/** Balance plus month-to-date inference spend. Returns `null` when unreadable. */
export async function readCreditSummary(agencyId: string): Promise<CreditSummary | null> {
  try {
    const client = createServerClient();
    const [{ data: agency, error: agencyError }, { data: ledger, error: ledgerError }] = await Promise.all([
      client.from("agencies").select("credits_balance_usd").eq("id", agencyId).maybeSingle(),
      client
        .from("agency_credits_ledger")
        .select("amount_usd")
        .eq("agency_id", agencyId)
        .eq("kind", "inference")
        .gte("created_at", monthStart()),
    ]);
    if (agencyError || ledgerError) return null;

    const balance = Number(
      (agency as { credits_balance_usd?: number | string } | null)?.credits_balance_usd ?? 0
    );
    const usedThisMonth = Math.abs(
      ((ledger ?? []) as Array<{ amount_usd: number | string }>).reduce(
        (sum, r) => sum + Number(r.amount_usd),
        0
      )
    );

    return {
      balance: Math.round(balance * 1e6) / 1e6,
      usedThisMonth: Math.round(usedThisMonth * 1e6) / 1e6,
      resetAt: nextMonthStart(),
    };
  } catch {
    return null;
  }
}/**
 * Deep health probe (rev.4 C5): proves the ledger is *reachable*, not merely that the process
 * is alive. A router that answers `/health` while unable to write debits is worse than one that
 * reports itself unhealthy, because it would silently give away inference.
 */
export async function ledgerHealth(): Promise<LedgerHealth> {
  try {
    const client = createServerClient();
    const { error } = await client.from("agency_credits_ledger").select("id").limit(1);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
