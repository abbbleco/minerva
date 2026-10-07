import { NextResponse } from "next/server";

import {
  billingCurrency,
  classifyWebhookEvent,
  computeGrant,
  disableSubscription,
  grantForPlan,
  isPaidTier,
  nextPeriodEnd,
  tierForAmountCents,
  verifyTransaction,
  verifyWebhookSignature,
} from "@/app/lib/paystack";
import { serviceClient } from "@/app/lib/members-server";

export const dynamic = "force-dynamic";

interface InvoiceRow {
  id: string;
  agency_id: string;
  subscription_id: string | null;
  amount: number | string;
  currency: string;
  status: string;
  gateway_reference: string | null;
}

interface SubscriptionRow {
  id: string;
  agency_id: string;
  plan: string;
  status: string;
  current_period_end: string | null;
  gateway_customer_id: string | null;
  gateway_subscription_id: string | null;
  gateway_subscription_token: string | null;
}

function log(...args: unknown[]) {
  console.error("[paystack:webhook]", ...args);
}

/** Grant a paid cycle: extend the period, top up headroom-capped credits. */
async function fulfillCycle(
  admin: ReturnType<typeof serviceClient>,
  sub: SubscriptionRow,
  plan: string,
  paidAtIso: string | null
): Promise<void> {
  const { credits, cap } = grantForPlan(plan as "plus" | "super" | "ultra");
  const { data: agency } = await admin
    .from("agencies")
    .select("credits_balance_usd")
    .eq("id", sub.agency_id)
    .maybeSingle();
  const balance = Number(
    (agency as { credits_balance_usd?: number | string | null } | null)?.credits_balance_usd ?? 0
  );
  const grant = computeGrant(Number.isFinite(balance) ? balance : 0, credits, cap);
  const end = nextPeriodEnd(sub.current_period_end, paidAtIso ?? undefined);
  const { error: subErr } = await admin
    .from("agency_subscriptions")
    .update({ plan, status: "active", current_period_start: paidAtIso, current_period_end: end })
    .eq("id", sub.id);
  if (subErr) throw new Error(`subscription update failed: ${subErr.message}`);
  if (grant > 0) {
    const { error: grantErr } = await admin.rpc("agency_credits_apply", {
      p_agency_id: sub.agency_id,
      p_amount: grant,
      p_kind: "grant",
      p_model: null,
      p_tokens: null,
      p_request_id: null,
      p_user_id: null,
    });
    if (grantErr) throw new Error(`credit grant failed: ${grantErr.message}`);
  }
}

async function markInvoicePaid(
  admin: ReturnType<typeof serviceClient>,
  invoiceId: string,
  subscriptionId: string | null
): Promise<void> {
  await admin
    .from("agency_invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      subscription_id: subscriptionId,
    })
    .eq("id", invoiceId);
}

async function subscriptionRowForCustomer(
  admin: ReturnType<typeof serviceClient>,
  customerCode: string | null
): Promise<SubscriptionRow | null> {
  if (!customerCode) return null;
  const { data } = await admin
    .from("agency_subscriptions")
    .select(
      "id, agency_id, plan, status, current_period_end, gateway_customer_id, gateway_subscription_id, gateway_subscription_token"
    )
    .eq("gateway", "paystack")
    .eq("gateway_customer_id", customerCode)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data ?? null) as SubscriptionRow | null;
}

/**
 * POST /api/billing/paystack/webhook — fulfillment for Paystack events.
 *
 * Authentication is the HMAC signature alone (no session: Paystack calls us).
 * Replays are harmless — every fulfillment is keyed off the transaction
 * reference or subscription code, and duplicates short-circuit. Transient
 * failures answer 5xx so Paystack retries; definitive states answer 200.
 */
export async function POST(request: Request) {
  const raw = await request.text().catch(() => "");
  const signature = request.headers.get("x-paystack-signature");
  if (!verifyWebhookSignature(raw, signature)) {
    log("rejected: bad signature");
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }
  let body: { event?: unknown; data?: Record<string, unknown> };
  try {
    body = JSON.parse(raw) as { event?: unknown; data?: Record<string, unknown> };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const kind = classifyWebhookEvent(body.event);
  if (kind === "ignore") return NextResponse.json({ ok: true, ignored: true });

  try {
    const admin = serviceClient();
    const data = body.data ?? {};

    if (kind === "subscription_payment") {
      const reference = typeof data.reference === "string" ? data.reference : "";
      if (!reference) {
        log("charge.success without reference");
        return NextResponse.json({ ok: true });
      }
      // Idempotency first: an already-paid invoice means this delivery is a replay.
      const { data: invoice } = await admin
        .from("agency_invoices")
        .select("id, agency_id, subscription_id, amount, currency, status, gateway_reference")
        .eq("gateway_reference", reference)
        .maybeSingle();
      if (invoice && (invoice as InvoiceRow).status === "paid") {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      // Ground truth from Paystack, never the event payload.
      let verified;
      try {
        verified = await verifyTransaction(reference);
      } catch (err) {
        log("verify failed, will retry on redelivery", reference, err instanceof Error ? err.message : err);
        return NextResponse.json({ error: "verify failed" }, { status: 502 });
      }
      if (verified.status !== "success") {
        log("verified non-success charge", reference, verified.status);
        return NextResponse.json({ ok: true });
      }
      if (invoice) {
        // Initial purchase: the checkout row names the expected amount, and
        // the amount itself names the tier (prices are unique per tier) —
        // metadata is never trusted for money.
        const row = invoice as InvoiceRow;
        // Invoice amounts are dollars; Paystack verifies in cents.
        const expectedCents = Math.round(Number(row.amount) * 100);
        if (expectedCents !== verified.amount || String(row.currency).toUpperCase() !== billingCurrency()) {
          log("AMOUNT MISMATCH — not granting", reference, { expected: row.amount, got: verified.amount });
          return NextResponse.json({ ok: true });
        }
        const plan = tierForAmountCents(verified.amount);
        if (!plan) {
          log("paid amount matches no tier", reference, verified.amount);
          return NextResponse.json({ ok: true });
        }
        const prev = await activePaystackRow(admin, row.agency_id);
        const sub = await upsertSubscriptionRow(admin, row.agency_id, plan, verified.customer_code);
        await enrichSubscriptionCodes(admin, sub.id, data);
        await fulfillCycle(admin, { ...sub, plan }, plan, verified.paid_at);
        await markInvoicePaid(admin, row.id, sub.id);
        // Plan change: retire the previous Paystack subscription (if any)
        // best-effort — the row already moved, so a disable failure only
        // risks a double cycle, which the next webhook surfaces.
        if (
          prev &&
          prev.plan !== plan &&
          prev.gateway_subscription_id &&
          prev.gateway_subscription_token
        ) {
          try {
            await disableSubscription(prev.gateway_subscription_id, prev.gateway_subscription_token);
          } catch (err) {
            log("old subscription disable failed", prev.gateway_subscription_id, err instanceof Error ? err.message : err);
          }
        }
        return NextResponse.json({ ok: true });
      }
      // Renewal: no checkout row — resolve via the customer on an active row.
      const sub = await subscriptionRowForCustomer(admin, verified.customer_code);
      if (!sub) {
        log("renewal for unknown customer", reference, verified.customer_code);
        return NextResponse.json({ ok: true });
      }
      if (!isPaidTier(sub.plan)) {
        log("renewal on non-paid row", reference, sub.plan);
        return NextResponse.json({ ok: true });
      }
      if (verified.amount <= 0) {
        log("renewal with non-positive amount", reference, verified.amount);
        return NextResponse.json({ ok: true });
      }
      await enrichSubscriptionCodes(admin, sub.id, data);
      await fulfillCycle(admin, sub, sub.plan, verified.paid_at);
      return NextResponse.json({ ok: true });
    }

    if (kind === "subscription_created") {
      // Store code + token for server-side disable; grants ride charge.success.
      const sub = (data.subscription ?? data) as Record<string, unknown>;
      const code = typeof sub.subscription_code === "string" ? sub.subscription_code : null;
      const customer =
        typeof sub.customer_code === "string"
          ? sub.customer_code
          : typeof (sub.customer as Record<string, unknown> | undefined)?.customer_code === "string"
            ? ((sub.customer as Record<string, unknown>).customer_code as string)
            : null;
      const row = await subscriptionRowForCustomer(admin, customer);
      if (row && code) {
        const token = typeof sub.email_token === "string" ? sub.email_token : null;
        await admin
          .from("agency_subscriptions")
          .update({ gateway_subscription_id: code, gateway_subscription_token: token })
          .eq("id", row.id);
      } else {
        log("subscription.create without a matching row", code, customer);
      }
      return NextResponse.json({ ok: true });
    }

    if (kind === "subscription_disabled" || kind === "subscription_not_renewing") {
      const sub = (data.subscription ?? data) as Record<string, unknown>;
      const code = typeof sub.subscription_code === "string" ? sub.subscription_code : null;
      if (!code) {
        log("cancel event without subscription code");
        return NextResponse.json({ ok: true });
      }
      const { data: row } = await admin
        .from("agency_subscriptions")
        .select("id")
        .eq("gateway", "paystack")
        .eq("gateway_subscription_id", code)
        .limit(1)
        .maybeSingle();
      if (row) {
        await admin
          .from("agency_subscriptions")
          .update({ status: "canceled" })
          .eq("id", (row as { id: string }).id);
      } else {
        log("cancel event for unknown subscription", code);
      }
      return NextResponse.json({ ok: true });
    }

    if (kind === "payment_failed") {
      const sub = (data.subscription ?? data) as Record<string, unknown>;
      const code = typeof sub.subscription_code === "string" ? sub.subscription_code : null;
      const customer =
        typeof (sub.customer as Record<string, unknown> | undefined)?.customer_code === "string"
          ? ((sub.customer as Record<string, unknown>).customer_code as string)
          : null;
      const row = code
        ? (
            await admin
              .from("agency_subscriptions")
              .select("id, agency_id, plan, status, current_period_end, gateway_customer_id, gateway_subscription_id, gateway_subscription_token")
              .eq("gateway", "paystack")
              .eq("gateway_subscription_id", code)
              .limit(1)
              .maybeSingle()
          ).data
        : null;
      const target = (row as SubscriptionRow | null) ?? (await subscriptionRowForCustomer(admin, customer));
      if (target) {
        await admin.from("agency_subscriptions").update({ status: "past_due" }).eq("id", target.id);
      } else {
        log("payment failure for unknown subscription");
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    log("fulfillment failed, will retry on redelivery", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "fulfillment failed" }, { status: 500 });
  }
}

const SUBSCRIPTION_COLUMNS =
  "id, agency_id, plan, status, current_period_end, gateway_customer_id, gateway_subscription_id, gateway_subscription_token";

/** Current paystack row for an agency, if any (plan changes upsert this row). */
async function activePaystackRow(
  admin: ReturnType<typeof serviceClient>,
  agencyId: string
): Promise<SubscriptionRow | null> {
  const { data } = await admin
    .from("agency_subscriptions")
    .select(SUBSCRIPTION_COLUMNS)
    .eq("agency_id", agencyId)
    .eq("gateway", "paystack")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data ?? null) as SubscriptionRow | null;
}

/** Point the agency's paystack row at a plan (insert on first purchase). */
async function upsertSubscriptionRow(
  admin: ReturnType<typeof serviceClient>,
  agencyId: string,
  plan: string,
  customerCode: string | null
): Promise<SubscriptionRow> {
  const existing = await activePaystackRow(admin, agencyId);
  if (existing) {
    const { data, error } = await admin
      .from("agency_subscriptions")
      .update({ plan, gateway_customer_id: customerCode })
      .eq("id", existing.id)
      .select(SUBSCRIPTION_COLUMNS)
      .single();
    if (error || !data) throw new Error(`subscription upsert failed: ${error?.message ?? "no row"}`);
    return data as SubscriptionRow;
  }
  const { data, error } = await admin
    .from("agency_subscriptions")
    .insert({ agency_id: agencyId, gateway: "paystack", plan, status: "incomplete", gateway_customer_id: customerCode })
    .select(SUBSCRIPTION_COLUMNS)
    .single();
  if (error || !data) {
    // Lost a race with a concurrent fulfillment: the unique (agency, gateway)
    // index won, so re-read and continue on that row.
    if (error && /duplicate|unique/i.test(error.message)) {
      const raced = await activePaystackRow(admin, agencyId);
      if (raced) return raced;
    }
    throw new Error(`subscription insert failed: ${error?.message ?? "no row"}`);
  }
  return data as SubscriptionRow;
}

/** Store the Paystack subscription code + email token for server-side disable. */
async function enrichSubscriptionCodes(
  admin: ReturnType<typeof serviceClient>,
  subscriptionId: string,
  data: Record<string, unknown>
): Promise<void> {
  const sub = (data.subscription ?? data) as Record<string, unknown>;
  const code = typeof sub.subscription_code === "string" ? sub.subscription_code : null;
  if (!code) return;
  const token = typeof sub.email_token === "string" ? sub.email_token : null;
  await admin
    .from("agency_subscriptions")
    .update({ gateway_subscription_id: code, gateway_subscription_token: token })
    .eq("id", subscriptionId);
}
