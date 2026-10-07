import { NextResponse } from "next/server";

import { disableSubscription } from "@/app/lib/paystack";
import { requireAgencyMember, serviceClient } from "@/app/lib/members-server";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/paystack/subscription/cancel — stop renewal. Owner only.
 *
 * Disables the Paystack subscription (best-effort first: a failed disable
 * leaves everything untouched so the call is safely retried) and marks the
 * row canceled. Entitlement runs to the paid period end — both tenant
 * resolutions treat canceled-with-future-period as paid.
 */
export async function POST() {
  const auth = await requireAgencyMember();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.ctx.membership.role !== "owner") {
    return NextResponse.json({ error: "only the agency owner can cancel the plan" }, { status: 403 });
  }
  try {
    const admin = serviceClient();
    const { data: row } = await admin
      .from("agency_subscriptions")
      .select("id, status, gateway_subscription_id, gateway_subscription_token")
      .eq("agency_id", auth.ctx.agency.id)
      .eq("gateway", "paystack")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sub = row as {
      id: string;
      status: string;
      gateway_subscription_id: string | null;
      gateway_subscription_token: string | null;
    } | null;
    if (!sub || (sub.status !== "active" && sub.status !== "past_due")) {
      return NextResponse.json({ error: "no active Paystack subscription to cancel" }, { status: 409 });
    }
    if (sub.gateway_subscription_id && sub.gateway_subscription_token) {
      try {
        await disableSubscription(sub.gateway_subscription_id, sub.gateway_subscription_token);
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Paystack disable failed" },
          { status: 502 }
        );
      }
    }
    const { error } = await admin
      .from("agency_subscriptions")
      .update({ status: "canceled" })
      .eq("id", sub.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "cancel failed" },
      { status: 500 }
    );
  }
}
