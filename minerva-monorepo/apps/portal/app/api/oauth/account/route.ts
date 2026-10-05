import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * GET /api/oauth/account — account and entitlement snapshot for the Minerva
 * backend's `nous` provider row.
 *
 * This is a compatibility adapter, not a native ABBBLE API. The backend
 * (`hermes_cli/nous_account.py`) calls it with the credential it holds and
 * reads a fixed shape: `user`, `organisation`, `paid_service_access`,
 * `subscription`, `tool_access`, `account_tier`, `managed_tools`. Every field
 * below is projected from this portal's own model (Supabase Auth + agencies +
 * subscriptions + ledger); nothing is proxied to Nous.
 *
 * Credentials accepted (either — the backend holds whichever flow minted it):
 *   - a Supabase access JWT (`Authorization: Bearer <jwt>` from a portal
 *     session). Verified against Auth; the first active agency membership
 *     becomes the organisation.
 *   - a router API key (`qkt_sec_*`, minted by the device or guest flows).
 *     Looked up by SHA-256 hash in `agency_api_keys`; the key's agency is the
 *     organisation. There is no user behind a key, so `user` is null and the
 *     client falls back to the organisation id, exactly as it does for a
 *     key-only Nous credential.
 *
 * Deliberate non-features, so a reader does not mistake absence for a bug:
 *   - `tool_access` is always disabled with empty coverage. ABBBLE has no
 *     managed tool pool; claiming coverage the router cannot honour would be
 *     worse than reporting none.
 *   - `managed_tools` is always false, for the same reason.
 *   - `account_tier` is `"standard"` for any authenticated caller. The free
 *     tier is a *plan* (`subscription.plan == "free"`), not an identity: the
 *     desktop renders its free-tier view only for the guest identity, which
 *     never reaches this endpoint.
 */

function serviceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error("Supabase service env missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  return createClient(url, service, { auth: { persistSession: false } });
}

/** ABBBLE plan id -> the integer tier the legacy contract's `subscription.tier` carries. */
function tierOf(plan: string | null): number | null {
  switch ((plan ?? "").toLowerCase()) {
    case "free":
      return 0;
    case "plus":
      return 1;
    case "super":
      return 2;
    case "ultra":
      return 3;
    default:
      return null;
  }
}

type Agency = { id: string; slug: string | null; name: string };
type Subscription = { plan: string; status: string; current_period_end: string | null };

async function agencyContext(admin: ReturnType<typeof serviceClient>, agencyId: string) {
  const { data: agency, error: agencyError } = await admin
    .from("agencies")
    .select("id, slug, name, status")
    .eq("id", agencyId)
    .maybeSingle();
  if (agencyError) throw new Error(agencyError.message);
  if (!agency) return null;

  const { data: subs } = await admin
    .from("agency_subscriptions")
    .select("plan, status, current_period_end")
    .eq("agency_id", (agency as Agency).id)
    .order("updated_at", { ascending: false })
    .limit(5);
  const rows = ((subs ?? []) as Subscription[]);
  const now = Date.now();
  const active = rows.find(
    (s) => s.status === "active" && (!s.current_period_end || new Date(s.current_period_end).getTime() > now)
  );
  const pastDue = rows.find((s) => s.status === "past_due");

  const paidPlans = new Set(["plus", "super", "ultra"]);
  const plan = active && paidPlans.has(active.plan) ? active.plan : "free";
  const paid = plan !== "free";
  const state = active && paid ? "active" : pastDue ? "past_due" : "free";

  return { agency: agency as Agency, plan, paid, state, pastDue: pastDue ?? null, active: active ?? null };
}

export async function GET(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer[ ]+(.+)$/i.exec(header.trim());
  if (!match) {
    return NextResponse.json({ error: "missing bearer token" }, { status: 401 });
  }
  const token = match[1]!.trim();

  try {
    const admin = serviceClient();

    // Path 1: router API key. Identified by prefix so a JWT is never hashed
    // and looked up as a key (which would always miss and 401 a valid user).
    if (token.startsWith("qkt_")) {
      const digest = createHash("sha256").update(token, "utf8").digest("hex");
      const { data: key, error: keyError } = await admin
        .from("agency_api_keys")
        .select("id, agency_id, status, expires_at")
        .eq("key_hash", digest)
        .maybeSingle();
      if (keyError) return NextResponse.json({ error: keyError.message }, { status: 500 });
      if (!key || (key as { status: string }).status !== "active") {
        return NextResponse.json({ error: "invalid api key" }, { status: 401 });
      }
      const row = key as { agency_id: string; expires_at: string | null };
      if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ error: "api key expired" }, { status: 401 });
      }
      const context = await agencyContext(admin, row.agency_id);
      if (!context) return NextResponse.json({ error: "agency not found" }, { status: 401 });
      return NextResponse.json(accountPayload(null, context));
    }

    // Path 2: Supabase access JWT. Verified, never decoded blindly: the claims
    // are only trusted after Auth confirms the signature and expiry.
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: "invalid access token" }, { status: 401 });
    }

    const { data: memberships } = await admin
      .from("agency_memberships")
      .select("agency_id, role, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(10);
    const membership = ((memberships ?? []) as Array<{ agency_id: string }>)[0];
    if (!membership) {
      // Authenticated but attached to nothing. Logged in with no org, not an
      // error: the client renders a signed-in, unprovisioned state.
      return NextResponse.json({
        user: { id: user.id, email: user.email },
        organisation: null,
        paid_service_access: { allowed: false, paid_access: false },
        subscription: null,
        tool_access: { enabled: false, coverage: {} },
        account_tier: "standard",
        managed_tools: false,
      });
    }

    const context = await agencyContext(admin, membership.agency_id);
    if (!context) return NextResponse.json({ error: "agency not found" }, { status: 401 });
    return NextResponse.json(accountPayload({ id: user.id, email: user.email }, context));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("service env") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

function accountPayload(
  user: { id: string; email: string | undefined } | null,
  context: NonNullable<Awaited<ReturnType<typeof agencyContext>>>
) {
  const { agency, plan, paid, state, active } = context;
  return {
    user,
    organisation: { id: agency.id, slug: agency.slug, name: agency.name },
    paid_service_access: {
      allowed: paid,
      paid_access: paid,
      organisation_id: agency.id,
      has_active_subscription: state === "active",
      active_subscription_is_paid: paid,
      subscription_tier: tierOf(plan),
      subscription_monthly_charge: null,
    },
    subscription: active
      ? {
          plan: active.plan,
          tier: tierOf(active.plan),
          monthly_charge: null,
          monthly_credits: null,
          current_period_end: active.current_period_end,
          credits_remaining: null,
          rollover_credits: null,
        }
      : {
          plan: "free",
          tier: 0,
          monthly_charge: null,
          monthly_credits: null,
          current_period_end: null,
          credits_remaining: null,
          rollover_credits: null,
        },
    tool_access: { enabled: false, coverage: {} },
    account_tier: "standard",
    managed_tools: false,
  };
}
