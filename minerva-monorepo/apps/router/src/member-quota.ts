/**
 * Per-member spend allowances: resolution for the gate input.
 *
 * Seats are free; owners/managers set a monthly USD allowance per seat that
 * draws against the agency balance (`agency_memberships.monthly_spend_cap_usd`,
 * NULL = no individual cap). This module answers "what has this member spent
 * this month against what cap" from the attributed ledger rows
 * (`agency_credits_ledger.user_id`, migration 043; pre-migration rows are
 * unattributed and excluded, never guessed).
 *
 * Fail-open throughout (gates philosophy): any unreadable state returns
 * `null` and the quota gate is skipped. A false 402 locks a seat out; a
 * missed enforcement is a finance ticket.
 */

import { createServerClient } from "@minerva/database";

export interface MemberQuota {
  used: number;
  limit: number;
}

function monthStartIso(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/**
 * `{used, limit}` for a member's allowance, or `null` when no cap applies
 * (no member, no cap set) or anything is unreadable. A $0 cap is meaningful
 * (seat paused) and is returned, not treated as absent.
 */
export async function readMemberQuota(
  agencyId: string,
  memberUserId: string | null | undefined
): Promise<MemberQuota | null> {
  if (!agencyId || !memberUserId) return null;
  try {
    const admin = createServerClient();
    const { data: membership, error: mErr } = await admin
      .from("agency_memberships")
      .select("monthly_spend_cap_usd")
      .eq("agency_id", agencyId)
      .eq("user_id", memberUserId)
      .eq("status", "active")
      .maybeSingle();
    if (mErr) return null;
    const rawCap = (membership as { monthly_spend_cap_usd?: number | string | null } | null)
      ?.monthly_spend_cap_usd;
    if (rawCap === null || rawCap === undefined) return null;
    const limit = Number(rawCap);
    if (!Number.isFinite(limit) || limit < 0) return null;

    let used = 0;
    try {
      const { data: rows, error: lErr } = await admin
        .from("agency_credits_ledger")
        .select("amount_usd")
        .eq("agency_id", agencyId)
        .eq("user_id", memberUserId)
        .eq("kind", "inference")
        .gte("created_at", monthStartIso());
      if (!lErr) {
        used = Math.abs(
          ((rows ?? []) as Array<{ amount_usd: number | string }>).reduce(
            (sum, r) => sum + Number(r.amount_usd),
            0
          )
        );
      }
      // A failed spend read understates usage (fail-open): the gate may pass
      // a capped member once, rather than 402ing the whole seat on a DB blip.
    } catch {
      // Same fail-open as above.
    }
    return { used, limit };
  } catch {
    return null;
  }
}
