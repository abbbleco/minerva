/**
 * Agency member data access (service role; authorization enforced in code).
 *
 * Reads/writes bypass RLS through the service client — the same posture as
 * the billing and keys routes — so every function here takes an explicit
 * membership and checks `members.ts` rules itself. Pure rules stay in
 * `members.ts` (unit-tested); this module is the impure shell.
 */

import { createClient } from "@supabase/supabase-js";

import { claimableInvites, normalizeEmail, type MembershipRow } from "./members";

export interface SessionMembership {
  id: string;
  agency_id: string;
  user_id: string;
  role: string;
  status: string;
}

export function serviceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error("Supabase service env missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  return createClient(url, service, { auth: { persistSession: false } });
}

/** Active memberships of a user, most-recent agency first (billing uses [0]; keep one rule). */
export async function activeMembershipsForUser(
  admin: ReturnType<typeof serviceClient>,
  userId: string
): Promise<SessionMembership[]> {
  const { data, error } = await admin
    .from("agency_memberships")
    .select("id, agency_id, user_id, role, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  return ((data ?? []) as SessionMembership[]).filter((m) => m.status === "active");
}

/**
 * Claim pending invites for a freshly-authenticated user. Best-effort: never
 * throws — a claim failure must not break sign-in (the invite simply stays
 * pending for the next login).
 */
export async function claimInvitesForUser(userId: string, email: string): Promise<void> {
  const clean = normalizeEmail(email);
  if (!clean || !userId) return;
  try {
    const admin = serviceClient();
    const { data: invited } = await admin
      .from("agency_memberships")
      .select("id, agency_id")
      .eq("status", "invited")
      .ilike("invite_email", clean);
    const rows = ((invited ?? []) as Array<{ id: string; agency_id: string }>);
    if (rows.length === 0) return;
    const active = await activeMembershipsForUser(admin, userId);
    const { claim, consume } = claimableInvites(
      rows,
      active.map((m) => m.agency_id)
    );
    for (const id of consume) {
      await admin.from("agency_memberships").delete().eq("id", id);
    }
    for (const id of claim) {
      // No transaction around the (agency_id, user_id) unique index: the
      // worst race is a skipped claim (unique violation, logged below) —
      // never a forked duplicate membership.
      const { error } = await admin
        .from("agency_memberships")
        .update({ user_id: userId, status: "active" })
        .eq("id", id)
        .eq("status", "invited");
      if (error) console.error("[members] invite claim failed", id, error.message);
    }
  } catch (err) {
    console.error("[members] invite claim failed", err instanceof Error ? err.message : err);
  }
}

/**
 * Deliver an invite email through Mailtrap (same sender config as the
 * contact-sales route). Returns false — not throws — when unconfigured or
 * rejected, so the route can report `emailed: false` instead of failing an
 * invite that is already saved.
 */
export async function sendInviteEmail(opts: {
  to: string;
  agencyName: string;
  role: string;
}): Promise<boolean> {
  const token = process.env.MAILTRAP_API_TOKEN?.trim();
  const fromEmail = process.env.MAILTRAP_FROM_EMAIL?.trim();
  if (!token || !fromEmail) {
    console.error("[members] invite email not configured (MAILTRAP_API_TOKEN / MAILTRAP_FROM_EMAIL)");
    return false;
  }
  const fromName = process.env.MAILTRAP_FROM_NAME?.trim() || "ABBBLE Portal";
  const portal = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://portal.abbble.co.za").trim().replace(/\/+$/, "");
  try {
    const res = await fetch("https://send.api.mailtrap.io/api/send", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: { email: fromEmail, name: fromName },
        to: [{ email: opts.to }],
        subject: `You've been invited to ${opts.agencyName} on ABBBLE Portal`,
        text: [
          `You've been invited to join ${opts.agencyName} as ${opts.role}.`,
          ``,
          `Create your account (or sign in) with this email address and the invite activates automatically:`,
          `${portal}/signup`,
          ``,
          `Your Minerva devices pick up the new agency on next sign-in.`,
        ].join("\n"),
        category: "member-invite",
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      console.error("[members] mailtrap rejected invite send", res.status, (await res.text().catch(() => "")).slice(0, 300));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[members] invite email failed", err instanceof Error ? err.message : err);
    return false;
  }
}

export interface CallerContext {
  userId: string;
  email: string;
  membership: SessionMembership;
  agency: { id: string; slug: string | null; name: string };
}

/**
 * Portal-session member context for member-management routes. Router-key
 * bearers are rejected: keys resolve to viewer with no user, and headcount is
 * never managed on a bearer credential.
 */
export async function requireAgencyMember(): Promise<
  | { ok: true; ctx: CallerContext }
  | { ok: false; status: 401 | 404; error: string }
> {
  try {
    const { getSupabaseServer } = await import("./supabase-server");
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, status: 401, error: "sign in to manage team members" };
    const admin = serviceClient();
    const memberships = await activeMembershipsForUser(admin, user.id);
    const membership = memberships[0];
    if (!membership) return { ok: false, status: 404, error: "no agency yet — connect Minerva first" };
    const { data: agency } = await admin
      .from("agencies")
      .select("id, slug, name")
      .eq("id", membership.agency_id)
      .maybeSingle();
    if (!agency) return { ok: false, status: 404, error: "agency not found" };
    const row = agency as { id: string; slug: string | null; name: string };
    return {
      ok: true,
      ctx: {
        userId: user.id,
        email: typeof user.email === "string" ? user.email : "",
        membership,
        agency: { id: row.id, slug: row.slug, name: row.name },
      },
    };
  } catch (err) {
    console.error("[members] session resolve failed", err instanceof Error ? err.message : err);
    return { ok: false, status: 401, error: "sign in to manage team members" };
  }
}

/**
 * Month-to-date inference spend per member (absolute USD), for the roster's
 * allowance display. One indexed aggregate per member — agencies are small,
 * and unattributed (pre-migration) rows are excluded, never guessed.
 * Fail-open: unreadable members map to null, never zero-as-fact.
 */
export async function monthSpendByUser(
  admin: ReturnType<typeof serviceClient>,
  agencyId: string,
  userIds: readonly string[]
): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>();
  if (userIds.length === 0) return out;
  const since = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
  await Promise.all(
    userIds.map(async (userId) => {
      try {
        const { data, error } = await admin
          .from("agency_credits_ledger")
          .select("amount_usd")
          .eq("agency_id", agencyId)
          .eq("user_id", userId)
          .eq("kind", "inference")
          .gte("created_at", since);
        if (error) {
          out.set(userId, null);
          return;
        }
        const total = ((data ?? []) as Array<{ amount_usd: number | string }>).reduce(
          (sum, r) => sum + Number(r.amount_usd),
          0
        );
        out.set(userId, Math.abs(total));
      } catch {
        out.set(userId, null);
      }
    })
  );
  return out;
}

/** Active owners of an agency besides `excludeId` (the last-owner guard). */
export async function countOtherActiveOwners(
  admin: ReturnType<typeof serviceClient>,
  agencyId: string,
  excludeId: string
): Promise<number> {
  const { count, error } = await admin
    .from("agency_memberships")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .eq("role", "owner")
    .eq("status", "active")
    .neq("id", excludeId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export type { MembershipRow };
