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
 * Approve a device sign-in. Auth required: whoever presents the user_code while
 * signed in binds THEIR agency (first non-viewer membership) and mints a
 * per-device server key for the polling device.
 */
export async function POST(request: NextRequest) {
  let body: { user_code?: unknown; name?: unknown };
  try {
    body = (await request.json()) as { user_code?: unknown; name?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const userCode = typeof body.user_code === "string" ? body.user_code.trim().toUpperCase() : "";
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 80) : "minerva-desktop";
  if (!userCode) return NextResponse.json({ error: "user_code required" }, { status: 400 });

  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { data: memberships, error: mErr } = await supabase
      .from("agency_memberships")
      .select("agency_id, role, status, agencies!inner(id, slug, name)")
      .eq("user_id", user.id)
      .eq("status", "active");
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });
    const rows = (memberships ?? []) as unknown as Array<{
      agency_id: string;
      role: string;
      agencies: { slug: string; name: string } | Array<{ slug: string; name: string }>;
    }>;
    const membership = rows.find((m) => m.role !== "viewer") ?? rows[0];
    if (!membership) return NextResponse.json({ error: "no active agency membership" }, { status: 403 });
    if (membership.role === "viewer") return NextResponse.json({ error: "editor role required" }, { status: 403 });
    const agency = Array.isArray(membership.agencies) ? membership.agencies[0] : membership.agencies;

    const admin = serviceClient();
    const { data: device, error: dErr } = await admin
      .from("portal_device_codes")
      .select("id, status, expires_at")
      .eq("user_code", userCode)
      .maybeSingle();
    if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 });
    if (!device) return NextResponse.json({ error: "unknown code" }, { status: 404 });
    if (device.status !== "pending" || new Date(device.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: "code expired or already used" }, { status: 410 });
    }

    const gen = generateApiKey("server");
    const { data: key, error: kErr } = await admin
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
      .select("id")
      .single();
    if (kErr || !key) return NextResponse.json({ error: kErr?.message ?? "key create failed" }, { status: 500 });

    const { error: uErr } = await admin
      .from("portal_device_codes")
      .update({
        status: "approved",
        agency_id: membership.agency_id,
        key_id: (key as { id: string }).id,
        key_token: gen.token,
        approved_at: new Date().toISOString(),
      })
      .eq("id", device.id);
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      agency: { slug: agency?.slug ?? "", name: agency?.name ?? "" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("service env") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
