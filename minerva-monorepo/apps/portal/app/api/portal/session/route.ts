import { NextResponse } from "next/server";
import { isPaidPlanId } from "@minerva/billing";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const dynamic = "force-dynamic";

/** Logged-in agency context for the Minerva connect panel. Null-safe when signed out. */
export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ user: null, agency: null, billing: null });

    const { data: memberships } = await supabase
      .from("agency_memberships")
      .select("agency_id, role, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(10);
    const membership = (memberships ?? [])[0] as { agency_id: string; role: string } | undefined;
    if (!membership) {
      return NextResponse.json({ user: { id: user.id, email: user.email }, agency: null, billing: null });
    }

    const { data: agency } = await supabase
      .from("agencies")
      .select("id, name, slug, plan, status, credits_balance_usd")
      .eq("id", membership.agency_id)
      .maybeSingle();
    if (!agency) {
      return NextResponse.json({ user: { id: user.id, email: user.email }, agency: null, billing: null });
    }

    const now = Date.now();
    const { data: subs } = await supabase
      .from("agency_subscriptions")
      .select("plan, status, current_period_end")
      .eq("agency_id", agency.id)
      .order("updated_at", { ascending: false })
      .limit(5);
    const rows = ((subs ?? []) as Array<{ plan: string; status: string; current_period_end: string | null }>);
    const active = rows.find(
      (s) => s.status === "active" && (!s.current_period_end || new Date(s.current_period_end).getTime() > now)
    );
    const pastDue = rows.find((s) => s.status === "past_due");
    const state = active && isPaidPlanId(active.plan) ? "active" : pastDue ? "past_due" : "free";
    const plan = active && isPaidPlanId(active.plan) ? active.plan : "free";

    const { data: ledger } = await supabase
      .from("agency_credits_ledger")
      .select("amount_usd")
      .eq("agency_id", agency.id)
      .eq("kind", "inference")
      .gte("created_at", new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString());
    const used = Math.abs(((ledger ?? []) as Array<{ amount_usd: number | string }>).reduce((s, r) => s + Number(r.amount_usd), 0));

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      agency: { id: agency.id, name: agency.name, slug: agency.slug, plan: agency.plan, status: agency.status },
      billing: {
        state,
        plan,
        balance: Number(agency.credits_balance_usd ?? 0),
        used: Math.round(used * 100) / 100,
      },
    });
  } catch (err) {
    return NextResponse.json({ user: null, agency: null, billing: null });
  }
}
