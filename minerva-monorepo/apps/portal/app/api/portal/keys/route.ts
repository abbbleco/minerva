import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateApiKey } from "@minerva/billing";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const dynamic = "force-dynamic";

function serviceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error("Supabase service env missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  return createClient(url, service, { auth: { persistSession: false } });
}

/**
 * Mint a server (desktop) key for the caller's agency. Mirrors
 * apps/web POST /api/v1/agency/[slug]/keys with purpose locked to `server`:
 * Minerva calls the router directly with a Bearer token.
 */
export async function POST(request: NextRequest) {
  let body: { name?: unknown; agencySlug?: unknown };
  try {
    body = (await request.json()) as { name?: unknown; agencySlug?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 80) : "hermes-desktop";
  const slug = typeof body.agencySlug === "string" && body.agencySlug.trim() ? body.agencySlug.trim() : undefined;

  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { data: memberships, error: mErr } = await supabase
      .from("agency_memberships")
      .select("agency_id, role, status, agencies!inner(id, slug)")
      .eq("user_id", user.id)
      .eq("status", "active");
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });
    const rows = (memberships ?? []) as unknown as Array<{
      agency_id: string;
      role: string;
      agencies: { slug: string } | Array<{ slug: string }>;
    }>;
    const slugOf = (m: (typeof rows)[number]): string => {
      const a = m.agencies;
      return Array.isArray(a) ? (a[0]?.slug ?? "") : (a?.slug ?? "");
    };
    const membership = slug ? rows.find((m) => slugOf(m) === slug) : rows[0];
    if (!membership) return NextResponse.json({ error: "no active agency membership" }, { status: 403 });
    if (membership.role === "viewer") return NextResponse.json({ error: "editor role required" }, { status: 403 });

    const gen = generateApiKey("server");
    const admin = serviceClient();
    const { data, error } = await admin
      .from("agency_api_keys")
      .insert({
        agency_id: membership.agency_id,
        name,
        purpose: "server",
        key_prefix: gen.prefix,
        key_last4: gen.last4,
        key_hash: gen.hash,
        created_by: user.id,
      })
      .select("id, agency_id, name, purpose, key_prefix, key_last4, status, created_at")
      .single();
    if (error || !data) return NextResponse.json({ error: error?.message ?? "key create failed" }, { status: 500 });

    return NextResponse.json({ key: data, api_key: gen.token }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("service env") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
