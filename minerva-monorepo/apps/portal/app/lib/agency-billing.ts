import { createClient } from "@supabase/supabase-js";

export interface AgencyContext {
  agency: { id: string; slug: string | null; name: string; status: string };
  membership: { role: string };
  plan: string;
  paid: boolean;
  state: "active" | "free" | "past_due";
  balanceUsd: number;
  spentThisMonthUsd: number;
  memberCount: number;
}

function serviceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error("Supabase service env missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  return createClient(url, service, { auth: { persistSession: false } });
}

/**
 * Resolve the agency behind a billing call. The credential is either a router
 * API key (device/guest flows) or a Supabase JWT (portal session) — the same
 * two forms `/api/oauth/account` accepts, because the backend presents
 * whichever flow minted its credential.
 *
 * Returns null when the credential is valid but attached to nothing (signed
 * in, unprovisioned), and throws on transport failure. Callers map those to
 * their own 401/empty shapes; this helper never invents an agency.
 */
export async function resolveAgencyContext(request: Request): Promise<AgencyContext | null> {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer[ ]+(.+)$/i.exec(header.trim());
  if (!match) {
    const error = new Error("missing bearer token") as Error & { status?: number };
    error.status = 401;
    throw error;
  }
  const token = match[1]!.trim();
  const admin = serviceClient();

  let agencyId: string | null = null;
  let role = "viewer";

  if (token.startsWith("qkt_")) {
    const { createHash } = await import("node:crypto");
    const digest = createHash("sha256").update(token, "utf8").digest("hex");
    const { data: key, error: keyError } = await admin
      .from("agency_api_keys")
      .select("agency_id, status, expires_at")
      .eq("key_hash", digest)
      .maybeSingle();
    if (keyError) throw new Error(keyError.message);
    if (!key || (key as { status: string }).status !== "active") {
      const error = new Error("invalid api key") as Error & { status?: number };
      error.status = 401;
      throw error;
    }
    const row = key as { agency_id: string; expires_at: string | null };
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      const error = new Error("api key expired") as Error & { status?: number };
      error.status = 401;
      throw error;
    }
    agencyId = row.agency_id;
    // A key carries no membership; role is resolved from the agency below when
    // the caller is a member, otherwise the key holder sees the agency as a
    // non-admin (least privilege for a bearer credential).
    role = "viewer";
  } else {
    const { getSupabaseServer } = await import("@/app/lib/supabase-server");
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      const error = new Error("invalid access token") as Error & { status?: number };
      error.status = 401;
      throw error;
    }
    const { data: memberships } = await admin
      .from("agency_memberships")
      .select("agency_id, role")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(10);
    const membership = ((memberships ?? []) as Array<{ agency_id: string; role: string }>)[0];
    if (!membership) return null;
    agencyId = membership.agency_id;
    role = membership.role;
  }

  const { data: agency, error: agencyError } = await admin
    .from("agencies")
    .select("id, slug, name, status, credits_balance_usd")
    .eq("id", agencyId)
    .maybeSingle();
  if (agencyError) throw new Error(agencyError.message);
  if (!agency) return null;
  const row = agency as AgencyContext["agency"] & { credits_balance_usd: number | string | null };

  const { data: subs } = await admin
    .from("agency_subscriptions")
    .select("plan, status, current_period_end")
    .eq("agency_id", row.id)
    .order("updated_at", { ascending: false })
    .limit(5);
  const subscriptions = ((subs ?? []) as Array<{ plan: string; status: string; current_period_end: string | null }>);
  const now = Date.now();
  const active = subscriptions.find(
    (s) => s.status === "active" && (!s.current_period_end || new Date(s.current_period_end).getTime() > now)
  );
  const paidPlans = new Set(["plus", "super", "ultra", "agency"]);
  const plan = active && paidPlans.has(active.plan) ? active.plan : "free";
  const paid = plan !== "free";
  const pastDue = subscriptions.find((s) => s.status === "past_due");
  const state = active && paid ? "active" : pastDue ? "past_due" : "free";

  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
  const { data: ledger } = await admin
    .from("agency_credits_ledger")
    .select("amount_usd")
    .eq("agency_id", row.id)
    .eq("kind", "inference")
    .gte("created_at", monthStart);
  const spent = Math.abs(
    ((ledger ?? []) as Array<{ amount_usd: number | string }>).reduce((s, r) => s + Number(r.amount_usd), 0)
  );

  const { count: members } = await admin
    .from("agency_memberships")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", row.id)
    .eq("status", "active");

  // A bare key carries no user, so its holder is never an admin through this
  // path — admin actions happen on the portal website, where the caller is a
  // signed-in member with a real role. Least privilege for a bearer credential.
  return {
    agency: { id: row.id, slug: row.slug, name: row.name, status: row.status },
    membership: { role },
    plan,
    paid,
    state: state as AgencyContext["state"],
    balanceUsd: Number(row.credits_balance_usd ?? 0),
    spentThisMonthUsd: Math.round(spent * 100) / 100,
    memberCount: members ?? 1,
  };
}

export function isAdminRole(role: string): boolean {
  return role === "owner";
}

/** Portal base for handoff URLs. Same origin in production; override per deploy. */
export function portalBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://portal.abbble.co.za").trim().replace(/\/+$/, "");
}
