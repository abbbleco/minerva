import { NextRequest, NextResponse } from "next/server";
import { generateApiKey } from "@minerva/billing";
import { routerBaseUrl, serviceClient, sha256Hex } from "../_lib";

export const dynamic = "force-dynamic";

const KEY_EXPIRES_SECONDS = 24 * 60 * 60;

/**
 * POST /api/anonymous/token {token} — exchange a grant once for a free-tier
 * router key.
 *
 * Returns `{access_token, expires_in, inference_base_url, user_id, org_id}`.
 * The `access_token` is the router API key itself: it is opaque to the client,
 * which falls back to `expires_in` for expiry when the token is not a JWT, and
 * defaults the account tier to anonymous. A consumed or unknown grant is a
 * terminal 404, never a retry — there is nothing to retry without a new grant.
 */
export async function POST(request: NextRequest) {
  let body: { token?: unknown };
  try {
    body = (await request.json()) as { token?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token.startsWith("anon_")) {
    return NextResponse.json({ error: "unknown_token" }, { status: 404 });
  }

  try {
    const admin = serviceClient();
    const { data: grant, error: gErr } = await admin
      .from("portal_anon_grants")
      .select("id, anon_user_id, org_id, status, expires_at, key_id")
      .eq("grant_hash", sha256Hex(token))
      .maybeSingle();
    if (gErr) return NextResponse.json({ error: gErr.message }, { status: 500 });
    if (!grant) return NextResponse.json({ error: "unknown_token" }, { status: 404 });

    const row = grant as {
      id: string;
      anon_user_id: string;
      org_id: string | null;
      status: string;
      expires_at: string;
      key_id: string | null;
    };
    if (row.status !== "active" || new Date(row.expires_at).getTime() <= Date.now()) {
      if (row.status === "active") {
        await admin.from("portal_anon_grants").update({ status: "expired" }).eq("id", row.id);
      }
      return NextResponse.json({ error: "unknown_token" }, { status: 404 });
    }

    // Already exchanged: the grant is single-use. Report consumed without
    // minting a second key — a replayed exchange must not multiply credentials.
    if (row.key_id) {
      await admin.from("portal_anon_grants").update({ status: "consumed" }).eq("id", row.id);
      return NextResponse.json({ error: "unknown_token" }, { status: 404 });
    }

    const gen = generateApiKey("server");
    const { data: key, error: kErr } = await admin
      .from("agency_api_keys")
      .insert({
        agency_id: row.org_id,
        name: "guest:anonymous",
        purpose: "server",
        key_prefix: gen.prefix,
        key_last4: gen.last4,
        key_hash: gen.hash,
        // The client is told expires_in = 24h; the row must agree, or a key
        // the client considers dead stays valid server-side indefinitely.
        expires_at: new Date(Date.now() + KEY_EXPIRES_SECONDS * 1000).toISOString(),
      })
      .select("id")
      .single();
    if (kErr || !key) return NextResponse.json({ error: kErr?.message ?? "key create failed" }, { status: 500 });

    await admin
      .from("portal_anon_grants")
      .update({ status: "consumed", key_id: (key as { id: string }).id })
      .eq("id", row.id);

    return NextResponse.json({
      access_token: gen.token,
      expires_in: KEY_EXPIRES_SECONDS,
      inference_base_url: `${routerBaseUrl()}/v1`,
      user_id: row.anon_user_id,
      org_id: row.org_id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("service env") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
