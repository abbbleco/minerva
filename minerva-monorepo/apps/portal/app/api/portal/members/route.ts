import { NextResponse } from "next/server";

import {
  canManageMembers,
  isMemberRole,
  mayGrantRole,
  normalizeAllowance,
  normalizeEmail,
  validateAllowance,
  validateInvite,
  type MemberRole,
} from "@/app/lib/members";
import {
  monthSpendByUser,
  requireAgencyMember,
  sendInviteEmail,
  serviceClient,
} from "@/app/lib/members-server";

export const dynamic = "force-dynamic";

function shape(row: {
  id: string;
  user_id: string | null;
  invite_email: string | null;
  role: string;
  status: string;
  created_at?: string | null;
  email?: string | null;
  monthly_spend_cap_usd?: number | string | null;
  month_spend_usd?: number | null;
}) {
  const cap =
    row.monthly_spend_cap_usd === null || row.monthly_spend_cap_usd === undefined
      ? null
      : Number(row.monthly_spend_cap_usd);
  return {
    id: row.id,
    email: row.email ?? row.invite_email,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    createdAt: row.created_at ?? null,
    monthlySpendCapUsd: Number.isFinite(cap) ? cap : null,
    monthSpendUsd: typeof row.month_spend_usd === "number" ? row.month_spend_usd : null,
  };
}

/**
 * GET /api/portal/members — roster of the caller's agency (active, invited,
 * suspended). Any active member may read; emails for claimed seats resolve
 * best-effort (null when the auth lookup fails).
 */
export async function GET() {
  const auth = await requireAgencyMember();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const admin = serviceClient();
    const { data, error } = await admin
      .from("agency_memberships")
      .select("id, user_id, invite_email, role, status, created_at, monthly_spend_cap_usd")
      .eq("agency_id", auth.ctx.agency.id)
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const rows = ((data ?? []) as Array<{
      id: string;
      user_id: string | null;
      invite_email: string | null;
      role: string;
      status: string;
      created_at: string | null;
      monthly_spend_cap_usd: number | string | null;
    }>);
    const spend = await monthSpendByUser(
      admin,
      auth.ctx.agency.id,
      rows.map((r) => r.user_id).filter((u): u is string => u !== null)
    );
    const out = [];
    for (const row of rows) {
      let email: string | null = null;
      if (row.user_id) {
        try {
          const { data: user } = await admin.auth.admin.getUserById(row.user_id);
          const addr = (user?.user as { email?: unknown } | null)?.email;
          email = typeof addr === "string" ? addr : null;
        } catch {
          email = null;
        }
      }
      out.push(shape({ ...row, email, month_spend_usd: row.user_id ? (spend.get(row.user_id) ?? null) : null }));
    }
    return NextResponse.json({
      agency: auth.ctx.agency,
      role: auth.ctx.membership.role,
      members: out,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "could not load members" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal/members — invite a seat: `{email, role}`. Owner/manager
 * only (owners alone may invite owners). Idempotent per email: a pending
 * invite resends instead of duplicating (the unique partial index agrees).
 * The row is saved first, the email second — a failed send reports
 * `emailed: false` rather than failing the invite.
 */
export async function POST(request: Request) {
  const auth = await requireAgencyMember();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const email = normalizeEmail(body.email);
  const role = body.role as MemberRole;
  const invalid = validateInvite(email, role) ?? validateAllowance(body.monthly_spend_cap_usd);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  if (!canManageMembers(auth.ctx.membership.role)) {
    return NextResponse.json({ error: "managers and owners only" }, { status: 403 });
  }
  if (!isMemberRole(role) || !mayGrantRole(auth.ctx.membership.role, role)) {
    return NextResponse.json({ error: "only an owner can invite owners" }, { status: 403 });
  }
  if (auth.ctx.email && email === normalizeEmail(auth.ctx.email)) {
    return NextResponse.json({ error: "that's your own seat — no invite needed" }, { status: 409 });
  }
  try {
    const admin = serviceClient();
    // Pending invite for this email: resend, don't duplicate.
    const { data: existing } = await admin
      .from("agency_memberships")
      .select("id, user_id, invite_email, role, status, created_at, monthly_spend_cap_usd")
      .eq("agency_id", auth.ctx.agency.id)
      .eq("status", "invited")
      .ilike("invite_email", email)
      .limit(1)
      .maybeSingle();
    if (existing) {
      const emailed = await sendInviteEmail({ to: email, agencyName: auth.ctx.agency.name, role });
      const row = existing as { id: string; user_id: string | null; invite_email: string; role: string; status: string; created_at: string };
      return NextResponse.json({ ok: true, resent: true, emailed, member: shape(row) });
    }
    const { data: inserted, error } = await admin
      .from("agency_memberships")
      .insert({
        agency_id: auth.ctx.agency.id,
        user_id: null,
        invite_email: email,
        role,
        status: "invited",
        monthly_spend_cap_usd: normalizeAllowance(body.monthly_spend_cap_usd),
      })
      .select("id, user_id, invite_email, role, status, created_at, monthly_spend_cap_usd")
      .single();
    if (error || !inserted) {
      // Lost a race with a concurrent invite: the unique partial index won,
      // so the pending row exists — resend against it.
      if (error && /duplicate|unique/i.test(error.message)) {
        const { data: raced } = await admin
          .from("agency_memberships")
          .select("id, user_id, invite_email, role, status, created_at, monthly_spend_cap_usd")
          .eq("agency_id", auth.ctx.agency.id)
          .eq("status", "invited")
          .ilike("invite_email", email)
          .limit(1)
          .maybeSingle();
        if (raced) {
          const emailed = await sendInviteEmail({ to: email, agencyName: auth.ctx.agency.name, role });
          return NextResponse.json({ ok: true, resent: true, emailed, member: shape(raced as never) });
        }
      }
      return NextResponse.json({ error: error?.message ?? "could not save invite" }, { status: 500 });
    }
    const emailed = await sendInviteEmail({ to: email, agencyName: auth.ctx.agency.name, role });
    return NextResponse.json({ ok: true, emailed, member: shape(inserted as never) }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "could not save invite" },
      { status: 500 }
    );
  }
}
