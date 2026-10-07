import { NextResponse } from "next/server";

import { paidPlan } from "@minerva/billing";

import {
  billingCurrency,
  ensureCustomer,
  initializeSubscriptionPayment,
  parsePaidTier,
  type PaidTier,
} from "@/app/lib/paystack";
import { requireAgencyMember, serviceClient } from "@/app/lib/members-server";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/paystack/checkout `{plan}` — start a subscription
 * purchase. Owner only: this moves agency money.
 *
 * Creates the Paystack customer for the owner's email when missing,
 * initializes a plan-attached transaction (Paystack auto-creates the
 * subscription on payment), records an open invoice row keyed by reference,
 * and returns the hosted checkout URL. Fulfillment happens in the webhook;
 * a plan change is a fresh purchase that replaces the old subscription.
 */
export async function POST(request: Request) {
  const auth = await requireAgencyMember();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.ctx.membership.role !== "owner") {
    return NextResponse.json({ error: "only the agency owner can purchase a plan" }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const tier: PaidTier | null = parsePaidTier(body.plan);
  if (!tier) {
    return NextResponse.json({ error: "plan must be plus, super, or ultra" }, { status: 400 });
  }
  if (!auth.ctx.email) {
    return NextResponse.json({ error: "your account has no email for receipts" }, { status: 400 });
  }
  try {
    const admin = serviceClient();
    // Ensure the customer exists (tagged with the agency) before the first
    // payment, so the subscription has an owner to attach to on arrival.
    await ensureCustomer(auth.ctx.email, auth.ctx.agency.id);
    const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://portal.abbble.co.za").trim().replace(/\/+$/, "");
    const init = await initializeSubscriptionPayment({
      email: auth.ctx.email,
      tier,
      agencyId: auth.ctx.agency.id,
      callbackUrl: `${site}/paystack/callback`,
    });
    // Expected amount in dollars (webhook compares in cents).
    const { error } = await admin.from("agency_invoices").insert({
      agency_id: auth.ctx.agency.id,
      subscription_id: null,
      amount: paidPlan(tier).amountCents / 100,
      currency: billingCurrency(),
      status: "open",
      gateway: "paystack",
      gateway_reference: init.reference,
      hosted_url: init.authorization_url,
    });
    if (error) {
      // Checkout initialized but untracked: the webhook will find no invoice
      // and refuse to grant (safe direction). Surface loudly for operators.
      console.error("[paystack:checkout] invoice insert failed", init.reference, error.message);
      return NextResponse.json({ error: "checkout started but could not be tracked — contact support" }, { status: 500 });
    }
    return NextResponse.json(
      { ok: true, authorization_url: init.authorization_url, reference: init.reference },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "checkout failed";
    const status = (err as Error & { status?: number }).status ?? 500;
    return NextResponse.json({ error: message }, { status });
  }
}
