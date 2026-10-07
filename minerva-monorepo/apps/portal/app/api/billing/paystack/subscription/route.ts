import { NextResponse } from "next/server";

import { requireAgencyMember, serviceClient } from "@/app/lib/members-server";

export const dynamic = "force-dynamic";

/**
 * GET /api/billing/paystack/subscription — the portal's own subscription
 * status for the manage page. Any active member may read; the frozen
 * `/api/billing/subscription` backend contract is left untouched.
 */
export async function GET() {
  const auth = await requireAgencyMember();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const admin = serviceClient();
    const { data } = await admin
      .from("agency_subscriptions")
      .select("plan, status, current_period_start, current_period_end, updated_at")
      .eq("agency_id", auth.ctx.agency.id)
      .eq("gateway", "paystack")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const row = data as {
      plan: string;
      status: string;
      current_period_start: string | null;
      current_period_end: string | null;
    } | null;
    return NextResponse.json({
      ok: true,
      configured: true,
      role: auth.ctx.membership.role,
      current: row
        ? {
            plan: row.plan,
            status: row.status,
            current_period_start: row.current_period_start,
            current_period_end: row.current_period_end,
          }
        : null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "could not load subscription" },
      { status: 500 }
    );
  }
}
