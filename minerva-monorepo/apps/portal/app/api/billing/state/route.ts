import { NextResponse } from "next/server";
import { isAdminRole, portalBase, resolveAgencyContext } from "@/app/lib/agency-billing";

export const dynamic = "force-dynamic";

/**
 * GET /api/billing/state — role-tiered billing overview for the Minerva
 * backend's billing screen.
 *
 * Compatibility adapter: the backend (`hermes_cli/nous_billing.py`) reads a
 * fixed shape and this portal projects its own model (agencies, subscriptions,
 * credits ledger) into it. Stripe-shaped fields the portal has no equivalent
 * for (`card`, `charge_presets`, `auto_reload`, `monthly_cap`) are returned as
 * null/empty/false rather than omitted, so the client renders "no card on
 * file" instead of crashing on a missing key.
 *
 * Consequences of having no card processor behind this API, stated plainly:
 *   - `can_charge` is false and `cli_billing_enabled` is false. The desktop
 *     hides its in-app charge UI and points at `portal_url` instead; top-ups
 *     happen on the portal website, not through this endpoint.
 *   - `can_change_plan` is false for the same reason: plan changes are a
 *     website flow (`/manage-subscription`), not an API mutation.
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

  const { agency, membership, plan, paid, state, balanceUsd, spentThisMonthUsd } = context;
  const admin = isAdminRole(membership.role);
  const base = portalBase();

  return NextResponse.json({
    ok: true,
    logged_in: true,
    balance_usd: balanceUsd,
    balance_display: `$${balanceUsd.toFixed(2)}`,
    card: null,
    charge_presets: [],
    charge_presets_display: [],
    cli_billing_enabled: false,
    is_admin: admin,
    can_charge: false,
    can_change_plan: false,
    max_usd: null,
    min_usd: null,
    monthly_cap: null,
    auto_reload: null,
    org_name: agency.name,
    role: membership.role,
    usage: {
      spent_this_month_usd: spentThisMonthUsd,
      spent_display: `$${spentThisMonthUsd.toFixed(2)}`,
      plan,
      billing_state: state,
    },
    portal_url: base,
    free_tier_account: !paid && plan === "free",
    free_tier_model: null,
  });
}
