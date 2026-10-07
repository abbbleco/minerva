import { NextResponse } from "next/server";
import { creditsForPlan, paidPlan, PAID_PLAN_IDS } from "@minerva/billing";
import { isAdminRole, portalBase, resolveAgencyContext } from "@/app/lib/agency-billing";

export const dynamic = "force-dynamic";

/**
 * GET /api/billing/subscription — subscription overview for the Minerva
 * backend's subscription screen.
 *
 * Same adapter posture as `/api/billing/state`: the shape is the backend's
 * contract (`hermes_cli/nous_billing.py`), the values are this portal's model.
 * Tier rows come from `@minerva/billing`, the single source of truth the
 * portal's own `/plans` page and `/api/portal/plans` already render — so the
 * desktop, the website and the API can never disagree on a price.
 *
 * `can_change_plan` is false: plan changes are a website flow
 * (`/manage-subscription`), not an API mutation, because there is no card
 * processor behind this endpoint.
 */
export async function GET(request: Request) {
  let context;
  try {
    context = await resolveAgencyContext(request);
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    const message = error instanceof Error ? error.message : String(error);
    if (status === 401) {
      return NextResponse.json({ ok: false, logged_in: false, error: message }, { status });
    }
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
  if (!context) {
    return NextResponse.json({ ok: true, logged_in: false });
  }

  const { agency, membership, plan, balanceUsd, spentThisMonthUsd, memberCount } = context;
  const admin = isAdminRole(membership.role);
  const base = portalBase();

  const tiers = [
    {
      tier_id: "free",
      name: "Free",
      tier_order: 0,
      dollars_per_month_display: "$0",
      monthly_credits: creditsForPlan("free"),
      is_current: plan === "free",
      is_enabled: true,
    },
    ...PAID_PLAN_IDS.map((id, index) => {
      const details = paidPlan(id);
      const major = details.amountCents / 100;
      return {
        tier_id: id,
        name: details.name,
        tier_order: index + 1,
        // Field name is the frozen backend contract; the value carries the
        // billing currency's symbol (R350 / $20).
        dollars_per_month_display:
          details.currency.toLowerCase() === "zar" ? `R${major}` : `$${major}`,
        monthly_credits: creditsForPlan(id),
        is_current: plan === id,
        is_enabled: true,
      };
    }),
  ];

  const current = tiers.find((t) => t.tier_id === plan) ?? tiers[0]!;

  return NextResponse.json({
    ok: true,
    logged_in: true,
    is_admin: admin,
    can_change_plan: false,
    org_name: agency.name,
    org_id: agency.id,
    role: membership.role,
    context: memberCount <= 1 ? "personal" : "team",
    current: {
      tier_id: current.tier_id,
      tier_name: current.name,
      monthly_credits: current.monthly_credits,
      credits_remaining: balanceUsd,
      cycle_ends_at: null,
      pending_downgrade_tier_name: null,
      pending_downgrade_at: null,
      pending_downgrade_display: null,
      cancel_at_period_end: false,
      cancellation_effective_at: null,
      cancellation_effective_display: null,
    },
    tiers,
    portal_url: base,
    usage: {
      spent_this_month_usd: spentThisMonthUsd,
      spent_display: `$${spentThisMonthUsd.toFixed(2)}`,
    },
  });
}
