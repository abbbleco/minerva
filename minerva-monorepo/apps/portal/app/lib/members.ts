/**
 * Agency member rules: roles, invite validation, and management guards.
 *
 * Pure (no Next, no Supabase) so `tests/members.test.ts` covers it without a
 * database. DB access lives in `members-server.ts`; HTTP in
 * `app/api/portal/members/**`.
 *
 * Role ladder (migration 023): owner > manager > operator > viewer.
 * People management is an owner/manager job — operators hold ops credentials,
 * not headcount. Only owners may grant or touch the owner role.
 */

export const MEMBER_ROLES = ["owner", "manager", "operator", "viewer"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const MEMBER_STATUSES = ["active", "invited", "suspended"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

export function isMemberRole(value: unknown): value is MemberRole {
  return typeof value === "string" && (MEMBER_ROLES as readonly string[]).includes(value);
}

/** Owner or manager: the only roles that may invite or manage members. */
export function canManageMembers(role: string | null | undefined): boolean {
  return role === "owner" || role === "manager";
}

/** Only an owner may grant the owner role (or touch a row that holds it). */
export function mayGrantRole(callerRole: string, targetRole: MemberRole): boolean {
  if (!canManageMembers(callerRole)) return false;
  if (targetRole === "owner") return callerRole === "owner";
  return true;
}

export function normalizeEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

/**
 * Validate an invite request. Returns the user-facing error, or null when the
 * request is well-formed (permission is the route's job, not this function's).
 */
export function validateInvite(email: unknown, role: unknown): string | null {
  const clean = normalizeEmail(email);
  if (!clean) return "an email address is required";
  if (clean.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(clean)) {
    return "that email address does not look valid";
  }
  if (!isMemberRole(role)) return "pick a role: owner, manager, operator, or viewer";
  return null;
}

/**
 * Validate a monthly spend allowance in USD: a finite number ≥ 0 (rounded to
 * cents), or null/undefined to clear back to pool-only. Returns the user-facing
 * error, or null when well-formed (permission is the route's job).
 */
export function validateAllowance(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const amount = typeof value === "string" ? Number(value.trim()) : Number(value);
  if (!Number.isFinite(amount)) return "allowance must be a dollar amount";
  if (amount < 0) return "allowance cannot be negative";
  if (amount > 1_000_000) return "allowance is unreasonably large";
  return null;
}

/** Normalize a valid allowance to cents-rounded dollars, or null to clear. */
export function normalizeAllowance(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  return Math.round(Number(value) * 100) / 100;
}

export interface MembershipRow {
  id: string;
  agency_id: string;
  user_id: string | null;
  invite_email: string | null;
  role: string;
  status: string;
}

export interface ManageGuard {
  ok: boolean;
  /** User-facing reason when `ok` is false. */
  reason?: string;
}

/**
 * Guard a role/status/remove mutation on one row. Pure so every rule is a unit
 * test; the route re-checks the last-owner invariant against live data.
 *
 * - nobody mutates their own row (ownership transfer is a separate, deliberate
 *   flow — self-service self-demotion strands agencies);
 * - managers never touch owner rows;
 * - only owners set the owner role.
 */
export function guardMutation(opts: {
  callerUserId: string;
  callerRole: string;
  target: Pick<MembershipRow, "id" | "user_id" | "role" | "status">;
  /** The change: a new role, a new status, a spend allowance, or removal. */
  change:
    | { kind: "role"; role: MemberRole }
    | { kind: "status"; status: MemberStatus }
    | { kind: "allowance" }
    | { kind: "remove" };
}): ManageGuard {
  const { callerUserId, callerRole, target, change } = opts;
  if (!canManageMembers(callerRole)) return { ok: false, reason: "managers and owners only" };
  if (target.user_id !== null && target.user_id === callerUserId) {
    return { ok: false, reason: "you cannot change your own membership — ask another owner" };
  }
  if (target.role === "owner" && callerRole !== "owner") {
    return { ok: false, reason: "only an owner can change an owner's membership" };
  }
  if (change.kind === "role") {
    if (!mayGrantRole(callerRole, change.role)) {
      return { ok: false, reason: "only an owner can grant the owner role" };
    }
    if (target.status !== "active" && target.user_id !== null) {
      return { ok: false, reason: "reactivate this member before changing their role" };
    }
  }
  if (change.kind === "status" && change.status === "active" && target.status === "invited") {
    return { ok: false, reason: "pending invites activate when the invitee signs in" };
  }
  return { ok: true };
}

/**
 * Split pre-filtered invite rows (status invited, email match) into claims
 * and consumes, given the agencies where this user is already an active
 * member. An invite into an agency the user already belongs to is stale and
 * consumed (deleted) instead of forked into a duplicate membership.
 */
export function claimableInvites(
  invited: Pick<MembershipRow, "id" | "agency_id">[],
  activeAgencyIds: ReadonlySet<string> | readonly string[]
): { claim: string[]; consume: string[] } {
  const active = activeAgencyIds instanceof Set ? activeAgencyIds : new Set(activeAgencyIds);
  const claim: string[] = [];
  const consume: string[] = [];
  for (const row of invited) {
    if (active.has(row.agency_id)) consume.push(row.id);
    else claim.push(row.id);
  }
  return { claim, consume };
}
