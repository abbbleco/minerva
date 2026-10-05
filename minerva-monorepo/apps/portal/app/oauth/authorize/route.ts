import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const dynamic = "force-dynamic";

function serviceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error("Supabase service env missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  return createClient(url, service, { auth: { persistSession: false } });
}

export interface AuthorizeParams {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
  state: string;
  scope: string;
}

/**
 * Validate an authorization request against the registered client. Returns the
 * cleaned params, or an error response when the request itself is malformed.
 * A malformed request (unknown client, bad redirect) is rejected WITHOUT
 * redirecting anywhere: redirecting an error to an unregistered URI would hand
 * an attacker a signed error they can fish with.
 */
export async function validateAuthorizeRequest(
  searchParams: URLSearchParams
): Promise<{ params: AuthorizeParams } | { response: NextResponse }> {
  const client_id = (searchParams.get("client_id") ?? "").trim();
  const redirect_uri = (searchParams.get("redirect_uri") ?? "").trim();
  const code_challenge = (searchParams.get("code_challenge") ?? "").trim();
  const code_challenge_method = (searchParams.get("code_challenge_method") ?? "S256").trim();
  const state = searchParams.get("state") ?? "";
  const scope = (searchParams.get("scope") ?? "").trim();

  if (!client_id || !redirect_uri || !code_challenge) {
    return { response: NextResponse.json({ error: "client_id, redirect_uri and code_challenge are required" }, { status: 400 }) };
  }
  if (code_challenge_method !== "S256" && code_challenge_method !== "plain") {
    return { response: NextResponse.json({ error: "code_challenge_method must be S256 or plain" }, { status: 400 }) };
  }
  if (code_challenge.length < 43 || code_challenge.length > 128) {
    return { response: NextResponse.json({ error: "code_challenge has an invalid length" }, { status: 400 }) };
  }
  if (state.length > 512) {
    return { response: NextResponse.json({ error: "state is too long" }, { status: 400 }) };
  }

  const admin = serviceClient();
  const { data: client, error } = await admin
    .from("portal_oauth_clients")
    .select("client_id, redirect_uris")
    .eq("client_id", client_id)
    .maybeSingle();
  if (error) return { response: NextResponse.json({ error: error.message }, { status: 500 }) };
  if (!client) {
    return { response: NextResponse.json({ error: "unknown client_id" }, { status: 400 }) };
  }
  const allowed = ((client as { redirect_uris: unknown }).redirect_uris ?? []) as string[];
  if (!Array.isArray(allowed) || !allowed.includes(redirect_uri)) {
    return { response: NextResponse.json({ error: "redirect_uri is not registered for this client" }, { status: 400 }) };
  }

  return { params: { client_id, redirect_uri, code_challenge, code_challenge_method, state, scope } };
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/**
 * GET /oauth/authorize — entry point for first-party OAuth sign-in.
 *
 * Validates the request, then: no session → login (with `next` back here, so
 * the flow resumes after sign-in); session → consent screen. Errors before a
 * session exists are JSON, never redirects, because there is no registered URI
 * to safely send them to yet.
 */
export async function GET(request: NextRequest) {
  const validated = await validateAuthorizeRequest(new URL(request.url).searchParams);
  if ("response" in validated) return validated.response;

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `/oauth/authorize?${new URL(request.url).searchParams.toString()}`);
    return NextResponse.redirect(login);
  }

  const consent = new URL("/oauth/consent", request.url);
  for (const [key, value] of new URL(request.url).searchParams) {
    consent.searchParams.set(key, value);
  }
  return NextResponse.redirect(consent);
}

/**
 * POST /oauth/authorize — the consent decision. Same-origin form POST from
 * the consent page; the session cookie authenticates it.
 *
 * `decision=allow` mints a single-use authorization code bound to the client,
 * the PKCE challenge, the user and the redirect URI, then redirects with
 * `?code=&state=`. `decision=deny` (or anything else) redirects with
 * `?error=access_denied&state=`.
 */
export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid form body" }, { status: 400 });
  }
  const decision = String(form.get("decision") ?? "");
  const params = {
    client_id: String(form.get("client_id") ?? ""),
    redirect_uri: String(form.get("redirect_uri") ?? ""),
    code_challenge: String(form.get("code_challenge") ?? ""),
    code_challenge_method: String(form.get("code_challenge_method") ?? "S256"),
    state: String(form.get("state") ?? ""),
    scope: String(form.get("scope") ?? ""),
  };
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }

  const validated = await validateAuthorizeRequest(search);
  if ("response" in validated) return validated.response;
  const { client_id, redirect_uri, code_challenge, code_challenge_method, state, scope } = validated.params;

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "sign-in required" }, { status: 401 });
  }

  const target = new URL(redirect_uri);
  if (decision !== "allow") {
    target.searchParams.set("error", "access_denied");
    if (state) target.searchParams.set("state", state);
    return NextResponse.redirect(target);
  }

  const admin = serviceClient();
  const code = `auth_${randomBytes(32).toString("base64url")}`;
  const { error } = await admin.from("portal_oauth_codes").insert({
    code_hash: sha256Hex(code),
    client_id,
    user_id: user.id,
    code_challenge,
    code_challenge_method,
    redirect_uri,
    scope,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  target.searchParams.set("code", code);
  if (state) target.searchParams.set("state", state);
  return NextResponse.redirect(target);
}
