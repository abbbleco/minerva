import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getJwtKey, signAccessToken, verifyPkceChallenge } from "@/app/lib/oauth-jwt";

export const dynamic = "force-dynamic";

const ACCESS_TTL_SECONDS = 3600;
const REFRESH_TTL_HOURS = 24;

function serviceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error("Supabase service env missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  return createClient(url, service, { auth: { persistSession: false } });
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://portal.abbble.co.za").trim().replace(/\/+$/, "");
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function errorBody(error: string, description: string, status: number) {
  // OAuth error shape (RFC 6749 §5.2): the client switches on `error`, and the
  // description is what a human reads in the log. Never a stack trace.
  return NextResponse.json({ error, error_description: description }, { status });
}

/**
 * POST /api/oauth/token — exchange an authorization code or refresh a session.
 *
 * Form-encoded, as OAuth clients send it (the Minerva backend posts forms, not
 * JSON). Two grants:
 *
 *   authorization_code: code, code_verifier, client_id, redirect_uri.
 *     Verifies the code is live and unconsumed, the PKCE verifier matches the
 *     stored challenge, and the redirect is the one the code was bound to.
 *     Consumes the code, then mints an access JWT (1h) plus a refresh token.
 *
 *   refresh_token: refresh_token, client_id.
 *     Consumes the presented token and issues a fresh pair (rotation). A
 *     presented token that is ALREADY consumed means reuse — the whole chain
 *     is revoked, because only a stolen copy gets presented twice.
 *
 * Access JWT claims match what the dashboard plugin verifies: `aud` is the
 * bare client_id, `iss` is this portal origin, `oauth_contract_version` is 1.
 */
export async function POST(request: NextRequest) {
  let form: URLSearchParams;
  try {
    form = new URLSearchParams(await request.text());
  } catch {
    return errorBody("invalid_request", "unreadable form body", 400);
  }
  const grant = form.get("grant_type")?.trim() ?? "";
  const clientId = form.get("client_id")?.trim() ?? "";
  if (!clientId) return errorBody("invalid_request", "client_id is required", 400);

  try {
    const admin = serviceClient();
    const { data: client, error: cErr } = await admin
      .from("portal_oauth_clients")
      .select("client_id")
      .eq("client_id", clientId)
      .maybeSingle();
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
    if (!client) return errorBody("invalid_client", "unknown client_id", 401);

    if (grant === "authorization_code") {
      return exchangeCode(admin, form, clientId);
    }
    if (grant === "refresh_token") {
      return rotateRefresh(admin, form, clientId);
    }
    return errorBody("unsupported_grant_type", `grant_type ${grant || "(missing)"} is not supported`, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("service env") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

async function exchangeCode(
  admin: ReturnType<typeof serviceClient>,
  form: URLSearchParams,
  clientId: string
) {
  const code = form.get("code")?.trim() ?? "";
  const verifier = form.get("code_verifier")?.trim() ?? "";
  const redirectUri = form.get("redirect_uri")?.trim() ?? "";
  if (!code || !verifier || !redirectUri) {
    return errorBody("invalid_request", "code, code_verifier and redirect_uri are required", 400);
  }

  const { data: row, error } = await admin
    .from("portal_oauth_codes")
    .select("id, user_id, agency_id, code_challenge, code_challenge_method, redirect_uri, scope, expires_at, consumed_at")
    .eq("code_hash", sha256Hex(code))
    .maybeSingle();
  // The table carries no status column: liveness is expires_at/consumed_at.
  // Fall back to the base set on a stale database rather than failing.
  const stored = (row ?? null) as null | {
    id: string;
    user_id: string;
    agency_id: string | null;
    code_challenge: string;
    code_challenge_method: string;
    redirect_uri: string;
    scope: string;
    expires_at: string;
    consumed_at: string | null;
  };
  if (error || !stored) {
    // Indistinguishable from expired: whether the code never existed, already
    // ran, or lapsed, the answer is the same — start over. Distinguishing
    // would let an attacker probe which codes are live.
    return errorBody("invalid_grant", "authorization code is invalid or expired", 400);
  }
  if (stored.consumed_at || new Date(stored.expires_at).getTime() <= Date.now()) {
    return errorBody("invalid_grant", "authorization code is invalid or expired", 400);
  }
  if (stored.redirect_uri !== redirectUri) {
    return errorBody("invalid_grant", "redirect_uri does not match the authorization request", 400);
  }
  if (!verifyPkceChallenge(verifier, stored.code_challenge, stored.code_challenge_method)) {
    return errorBody("invalid_grant", "PKCE verifier does not match the challenge", 400);
  }

  await admin.from("portal_oauth_codes").update({ consumed_at: new Date().toISOString() }).eq("id", stored.id);

  return (
    await issuePair(admin, {
      clientId,
      userId: stored.user_id,
      agencyId: stored.agency_id,
      scope: stored.scope,
    })
  ).response;
}

async function rotateRefresh(
  admin: ReturnType<typeof serviceClient>,
  form: URLSearchParams,
  clientId: string
) {
  const presented = form.get("refresh_token")?.trim() ?? "";
  if (!presented) return errorBody("invalid_request", "refresh_token is required", 400);

  const { data: row, error } = await admin
    .from("portal_oauth_refresh_tokens")
    .select("id, user_id, agency_id, scope, expires_at, consumed_at, revoked_at")
    .eq("token_hash", sha256Hex(presented))
    .maybeSingle();
  if (error || !row) {
    return errorBody("invalid_grant", "refresh token is invalid or expired", 400);
  }
  const stored = row as {
    id: string;
    user_id: string;
    agency_id: string | null;
    scope: string;
    expires_at: string;
    consumed_at: string | null;
    revoked_at: string | null;
  };
  if (stored.revoked_at) {
    return errorBody("invalid_grant", "refresh token has been revoked", 400);
  }
  if (stored.consumed_at) {
    // Reuse: this token already bought a replacement, so this presentation is
    // a copy. Revoke the chain — the replacement included — and fail closed.
    // A legitimate client never presents a consumed token; only a stolen one
    // gets presented twice.
    await admin
      .from("portal_oauth_refresh_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .or(`id.eq.${stored.id},replaced_by.eq.${stored.id}`);
    return errorBody("invalid_grant", "refresh token has already been used", 400);
  }
  if (new Date(stored.expires_at).getTime() <= Date.now()) {
    return errorBody("invalid_grant", "refresh token has expired", 400);
  }

  const issued = await issuePair(admin, {
    clientId,
    userId: stored.user_id,
    agencyId: stored.agency_id,
    scope: stored.scope,
  });
  if (!("refreshId" in issued)) return issued.response;
  const replacementId = issued.refreshId;
  // Link first, then consume: a crash between the two leaves the old token
  // live rather than stranding the client with nothing.
  if (replacementId) {
    await admin.from("portal_oauth_refresh_tokens").update({ replaced_by: replacementId }).eq("id", stored.id);
  }
  await admin
    .from("portal_oauth_refresh_tokens")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", stored.id);
  return issued.response;
}

async function issuePair(
  admin: ReturnType<typeof serviceClient>,
  args: { clientId: string; userId: string; agencyId: string | null; scope: string }
): Promise<{ response: NextResponse; refreshId: string } | { response: NextResponse }> {
  const access = signAccessToken(
    {
      aud: args.clientId,
      iss: siteUrl(),
      sub: args.userId,
      org_id: args.agencyId ?? undefined,
      client_id: args.clientId,
      oauth_contract_version: 1,
      scope: args.scope || undefined,
    },
    ACCESS_TTL_SECONDS
  );

  const refreshToken = `rt_${randomBytes(32).toString("base64url")}`;
  const { data: inserted, error } = await admin
    .from("portal_oauth_refresh_tokens")
    .insert({
      token_hash: sha256Hex(refreshToken),
      client_id: args.clientId,
      user_id: args.userId,
      agency_id: args.agencyId,
      scope: args.scope,
      expires_at: new Date(Date.now() + REFRESH_TTL_HOURS * 3600 * 1000).toISOString(),
    })
    .select("id")
    .single();
  if (error || !inserted) {
    return {
      response: NextResponse.json({ error: error?.message ?? "refresh token create failed" }, { status: 500 }),
    };
  }

  const response = NextResponse.json({
    access_token: access,
    token_type: "Bearer",
    expires_in: ACCESS_TTL_SECONDS,
    refresh_token: refreshToken,
    scope: args.scope || undefined,
  });
  // The id travels alongside the response (never inside it) so rotation can
  // link the replacement before consuming the presented token.
  return { response, refreshId: (inserted as { id: string }).id };
}
