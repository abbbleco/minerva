/**
 * Tenant resolution for the router: `Authorization: Bearer qkt_sec_*` -> agency + entitlement.
 *
 * Mirrors `apps/web/lib/agency.ts#resolveAgencyFromKey` but lives here because the router must
 * not import from the Next app. The hashing comes from `@minerva/billing` so both sides derive
 * the same digest — a mismatch would 401 every call.
 *
 * FAIL-OPEN BOUNDARY (plan §3.4.2, rev.4 C5)
 * -----------------------------------------
 * Auth failure is NOT fail-open: without a verified key we cannot attribute spend, so 401 is
 * correct. But once the tenant is known, a failed *balance* or *quota* read yields `null` and
 * the corresponding gate is skipped. A false 402 is an outage for every tenant at once; a
 * missed debit is a finance ticket.
 */

import { createServerClient } from "@minerva/database";
import { hashApiKey, isPaidPlanId, type BillingState, type PlanId } from "@minerva/billing";

export interface RouterTenant {
  agencyId: string;
  agencySlug: string;
  plan: PlanId;
  billingState: BillingState;
  /** USD, or `null` when the read failed -> credits gate skipped. */
  balanceUsd: number | null;
  /** `null` when the read failed -> quota gate skipped. */
  quota: { used: number; limit: number } | null;
  keyId: string;
  keyName: string;
}

export type TenantResult =
  | { ok: true; tenant: RouterTenant }
  | { ok: false; status: 401 | 403 | 402; code: string; message: string };

function bearer(authorization: string | undefined): string | null {
  if (!authorization) return null;
  const m = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return m?.[1]?.trim() || null;
}

interface KeyRow {
  id: string;
  agency_id: string;
  name: string;
  purpose: string;
  status: string;
  expires_at: string | null;
}

interface AgencyRow {
  id: string;
  slug: string;
  plan: string;
  status: string;
  credits_balance_usd: number | string | null;
}

interface SubRow {
  plan: string;
  status: string;
  current_period_end: string | null;
}

export async function resolveTenant(authorization: string | undefined): Promise<TenantResult> {
  const token = bearer(authorization);
  if (!token) {
    return { ok: false, status: 401, code: "unauthorized", message: "missing bearer token" };
  }

  let client: ReturnType<typeof createServerClient>;
  try {
    client = createServerClient();
  } catch (err) {
    // Supabase is unconfigured. We cannot authenticate anyone, so this is a hard failure —
    // but say so plainly rather than pretending the key was bad.
    return {
      ok: false,
      status: 401,
      code: "not_configured",
      message: err instanceof Error ? err.message : "database not configured",
    };
  }

  const { data: key, error: keyError } = await client
    .from("agency_api_keys")
    // NOTE: `rate_limit_per_min` is deliberately NOT selected or enforced here. Rate limiting is
    // owned by the upstream APIs (owner decision 2026-09-30) — the router's job is to surface
    // their 429 faithfully, not to impose a second, diverging limit. The web app's intake route
    // still enforces this column for form submissions, which upstream never sees.
    .select("id, agency_id, name, purpose, status, expires_at")
    .eq("key_hash", hashApiKey(token))
    .maybeSingle();

  if (keyError) {
    return { ok: false, status: 401, code: "lookup_failed", message: keyError.message };
  }
  const keyRow = key as KeyRow | null;
  if (!keyRow) {
    return { ok: false, status: 401, code: "invalid_key", message: "invalid api key" };
  }
  if (keyRow.status !== "active") {
    return { ok: false, status: 401, code: "key_inactive", message: "api key is not active" };
  }
  if (keyRow.expires_at && new Date(keyRow.expires_at).getTime() < Date.now()) {
    return { ok: false, status: 401, code: "key_expired", message: "api key expired" };
  }

  const { data: agency, error: agencyError } = await client
    .from("agencies")
    .select("id, slug, plan, status, credits_balance_usd")
    .eq("id", keyRow.agency_id)
    .maybeSingle();

  if (agencyError) {
    return { ok: false, status: 401, code: "lookup_failed", message: agencyError.message };
  }
  const agencyRow = agency as AgencyRow | null;
  if (!agencyRow) {
    return { ok: false, status: 401, code: "agency_missing", message: "agency not found" };
  }
  if (agencyRow.status === "suspended") {
    return { ok: false, status: 403, code: "suspended", message: "agency is suspended" };
  }

  // ---- Subscription state ------------------------------------------------
  // A failed subscription read is treated as "no paid subscription" (free tier), not as an
  // error: it degrades to a stricter tier rather than locking the tenant out.
  const { data: subs } = await client
    .from("agency_subscriptions")
    .select("plan, status, current_period_end")
    .eq("agency_id", agencyRow.id)
    .order("updated_at", { ascending: false });

  const rows = (subs ?? []) as SubRow[];
  const now = Date.now();
  const active = rows.find(
    (s) => s.status === "active" && (!s.current_period_end || new Date(s.current_period_end).getTime() > now)
  );
  const pastDue = rows.find((s) => s.status === "past_due");

  let plan: PlanId = "free";
  let billingState: BillingState = "free";
  if (active && isPaidPlanId(active.plan)) {
    plan = active.plan;
    billingState = "active";
  } else if (pastDue && isPaidPlanId(pastDue.plan)) {
    plan = pastDue.plan;
    billingState = "past_due";
  }

  if (billingState === "past_due") {
    return {
      ok: false,
      status: 402,
      code: "billing_required",
      message: "Subscription is past_due. Update billing to continue.",
    };
  }

  // ---- Balance (fail-open) ----------------------------------------------
  let balanceUsd: number | null = null;
  const rawBalance = agencyRow.credits_balance_usd;
  if (rawBalance !== null && rawBalance !== undefined) {
    const n = Number(rawBalance);
    balanceUsd = Number.isFinite(n) ? n : null;
  }

  return {
    ok: true,
    tenant: {
      agencyId: agencyRow.id,
      agencySlug: agencyRow.slug,
      plan,
      billingState,
      balanceUsd,
      // Quota enforcement for the free tier happens at intake (briefs) and in the web app;
      // the router's binding limit is the credit balance. Left null so the gate is skipped
      // rather than double-counting a metric the router does not own.
      quota: null,
      keyId: keyRow.id,
      keyName: keyRow.name,
    },
  };
}
