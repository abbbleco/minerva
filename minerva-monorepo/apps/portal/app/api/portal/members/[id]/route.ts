import { NextResponse } from "next/server";

import {
  guardMutation,
  isMemberRole,
  normalizeAllowance,
  validateAllowance,
  type MemberRole,
  type MemberStatus,
} from "@/app/lib/members";
import { countOtherActiveOwners, requireAgencyMember, serviceClient } from "@/app/lib/members-server";

export const dynamic = "force-dynamic";

const EDITABLE_STATUSES = ["active", "suspended"] as const;

async function loadTarget(admin: ReturnType<typeof serviceClient>, agencyId: string, id: string) {
  const { data } = await admin
    .from("agency_memberships")
    .select("id, agency_id, user_id, role, status")
    .eq("id", id)
    .eq("agency_id", agencyId)
    .maybeSingle();
  return (data ?? null) as {
    id: string;
    agency_id: string;
    user_id: string | null;
    role: string;
    status: string;
  } | null;
}

/** True when the change would deactivate an active owner row (demote, suspend, or remove). */
function deactivatesOwner(
  target: { role: string; status: string },
  change:
    | { kind: "role"; role: MemberRole }
    | { kind: "status"; status: MemberStatus }
    | { kind: "allowance" }
    | { kind: "remove" }
): boolean {
  // Allowance edits never touch standing — only role, status, and removal can.
  if (change.kind === "allowance") return false;
  if (target.role !== "owner" || target.status !== "active") return false;
  if (change.kind === "remove") return true;
  if (change.kind === "status") return change.status !== "active";
  return change.role !== "owner";
}

/**
 * PATCH /api/portal/members/:id — change role (`{role}`) or status
 * (`{status: active|suspended}`). Suspended members keep their seat but lose
 * access; pending invites activate on sign-in, never here.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAgencyMember();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const fields = ["role", "status", "monthly_spend_cap_usd"].filter((k) => body[k] !== undefined);
  if (fields.length !== 1) {
    return NextResponse.json(
      { error: "send exactly one of role, status, or monthly_spend_cap_usd" },
      { status: 400 }
    );
  }
  if (body.monthly_spend_cap_usd !== undefined) {
    const invalid = validateAllowance(body.monthly_spend_cap_usd);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  }
  const change = (
    body.role !== undefined
      ? { kind: "role" as const, role: body.role as MemberRole }
      : body.status !== undefined
        ? { kind: "status" as const, status: body.status as MemberStatus }
        : { kind: "allowance" as const }
  );
  if (change.kind === "role" && !isMemberRole(change.role)) {
    return NextResponse.json({ error: "unknown role" }, { status: 400 });
  }
  if (
    change.kind === "status" &&
    !(EDITABLE_STATUSES as readonly string[]).includes(change.status)
  ) {
    return NextResponse.json({ error: "status must be active or suspended" }, { status: 400 });
  }
  try {
    const admin = serviceClient();
    const target = await loadTarget(admin, auth.ctx.agency.id, id);
    if (!target) return NextResponse.json({ error: "member not found" }, { status: 404 });
    const guard = guardMutation({
      callerUserId: auth.ctx.userId,
      callerRole: auth.ctx.membership.role,
      target,
      change,
    });
    if (!guard.ok) {
      const forbidden = guard.reason === "managers and owners only";
      return NextResponse.json({ error: guard.reason }, { status: forbidden ? 403 : 400 });
    }
    if (deactivatesOwner(target, change)) {
      const others = await countOtherActiveOwners(admin, auth.ctx.agency.id, target.id);
      if (others === 0) {
        return NextResponse.json(
          { error: "the agency needs at least one active owner — grant ownership first" },
          { status: 409 }
        );
      }
    }
    const patch =
      change.kind === "role"
        ? { role: change.role }
        : change.kind === "status"
          ? { status: change.status }
          : { monthly_spend_cap_usd: normalizeAllowance(body.monthly_spend_cap_usd) };
    const { error } = await admin.from("agency_memberships").update(patch).eq("id", target.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "could not update member" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/portal/members/:id — remove a seat (active) or cancel a pending
 * invite. Never strands an agency without an active owner.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAgencyMember();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  try {
    const admin = serviceClient();
    const target = await loadTarget(admin, auth.ctx.agency.id, id);
    if (!target) return NextResponse.json({ error: "member not found" }, { status: 404 });
    const guard = guardMutation({
      callerUserId: auth.ctx.userId,
      callerRole: auth.ctx.membership.role,
      target,
      change: { kind: "remove" },
    });
    if (!guard.ok) {
      const forbidden = guard.reason === "managers and owners only";
      return NextResponse.json({ error: guard.reason }, { status: forbidden ? 403 : 400 });
    }
    if (deactivatesOwner(target, { kind: "remove" })) {
      const others = await countOtherActiveOwners(admin, auth.ctx.agency.id, target.id);
      if (others === 0) {
        return NextResponse.json(
          { error: "the agency needs at least one active owner — grant ownership first" },
          { status: 409 }
        );
      }
    }
    const { error } = await admin.from("agency_memberships").delete().eq("id", target.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "could not remove member" },
      { status: 500 }
    );
  }
}
