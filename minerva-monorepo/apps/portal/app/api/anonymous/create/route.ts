import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { clientIp, ipHash, serviceClient, sha256Hex } from "../_lib";

export const dynamic = "force-dynamic";

const IDLE_TTL_DAYS = 7;
const GRANTS_PER_DAY = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * POST /api/anonymous/create — mint a single-use guest grant. No auth: this is
 * the "try Minerva" path.
 *
 * Returns `{user_id, org_id, token, idle_ttl_days}`. The token starts with
 * `anon_` (the client requires the prefix) and is shown exactly once — only
 * its hash is stored. The grant is good for one exchange within 7 days.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = serviceClient();

    const hash = ipHash(clientIp(request));
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const { count, error: cErr } = await admin
      .from("portal_anon_grants")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", hash)
      .gte("created_at", since);
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
    if ((count ?? 0) >= GRANTS_PER_DAY) {
      return NextResponse.json(
        { error: "anon_rate_limited", retry_after: WINDOW_MS / 1000 },
        { status: 429, headers: { "retry-after": String(WINDOW_MS / 1000) } }
      );
    }

    // The guest agency must exist (migration 036 seeds it). Without it there
    // is no free tier to grant, and minting a key against nothing would be a
    // credential that resolves nowhere.
    const { data: guest } = await admin.from("agencies").select("id").eq("slug", "guest").maybeSingle();
    if (!guest) {
      return NextResponse.json({ error: "anon_gate_paused" }, { status: 503 });
    }

    const token = `anon_${randomBytes(24).toString("base64url")}`;
    const anonUserId = `anon_${randomBytes(12).toString("base64url")}`;
    const { error: iErr } = await admin.from("portal_anon_grants").insert({
      grant_hash: sha256Hex(token),
      anon_user_id: anonUserId,
      org_id: (guest as { id: string }).id,
      ip_hash: hash,
    });
    if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

    return NextResponse.json(
      {
        user_id: anonUserId,
        org_id: (guest as { id: string }).id,
        token,
        idle_ttl_days: IDLE_TTL_DAYS,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("service env") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
