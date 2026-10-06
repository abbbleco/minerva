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

type MembershipRow = {
  agency_id: string;
  role: string;
  agencies: { slug: string; name: string } | Array<{ slug: string; name: string }>;
};

function agencyOf(membership: MembershipRow | undefined): { slug: string; name: string } | undefined {
  if (!membership) return undefined;
  const agencies = membership.agencies;
  return Array.isArray(agencies) ? agencies[0] : agencies;
}

/**
 * Mint a personal agency + owner membership for a user with no agency rows
 * at all. Idempotent under double-submit: a slug collision (two concurrent
 * approves) falls back to the membership the other request created.
 */
async function provisionPersonalAgency(
  userId: string,
): Promise<
  | { agency_id: string; slug: string; name: string }
  | { response: NextResponse }
> {
  const fail = (message: string, status = 500) => ({
    response: NextResponse.json({ error: message }, { status }),
  });
  const slug = `personal-${userId.replace(/-/g, "").slice(0, 12).toLowerCase()}`;
  const name = "Personal";
  const admin = serviceClient();
  const { data: agency, error: aErr } = await admin
    .from("agencies")
    .insert({ name, slug, created_by: userId })
    .select("id, slug, name")
    .single();
  if (aErr || !agency) {
    // 40909 unique violation = a concurrent approve won the race; adopt it.
    const { data: existing } = await admin
      .from("agency_memberships")
      .select("agency_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    const adoptedId =
      (existing as { agency_id?: string } | null)?.agency_id ?? undefined;
    if (!adoptedId) return fail(aErr?.message ?? "agency provision failed");
    const { data: adopted } = await admin
      .from("agencies")
      .select("slug, name")
      .eq("id", adoptedId)
      .maybeSingle();
    const row = (adopted ?? {}) as { slug?: string; name?: string };
    return { agency_id: adoptedId, slug: row.slug ?? "", name: row.name ?? "" };
  }
  const row = agency as { id: string; slug: string; name: string };
  const { error: mErr } = await admin.from("agency_memberships").insert({
    agency_id: row.id,
    user_id: userId,
    role: "owner",
    status: "active",
  });
  if (mErr) return fail(mErr.message);
  return { agency_id: row.id, slug: row.slug, name: row.name };
}

/**
 * Approve a device sign-in. Auth required: whoever presents the user_code while
 * signed in binds an agency and mints a per-device server key for the polling
 * device. Connecting a device is identity-level, not agency-level: a signed-in
 * user with no agency gets a personal one provisioned (owner role) instead of
 * a 403, so personal/free-tier sign-in is never blocked on agency membership.
 * Viewer-only and suspended memberships keep their existing refusals.
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
    if (membership && membership.role === "viewer") {
      return NextResponse.json({ error: "editor role required" }, { status: 403 });
    }
    let agencyId = membership?.agency_id;
    let agency = agencyOf(membership);
    if (!membership) {
      // No active membership at all: distinguish suspended/invited (keep the
      // refusal — a fresh agency must not launder a suspension) from a genuinely
      // new user (provision a personal agency).
      const { data: anyRows, error: anyErr } = await supabase
        .from("agency_memberships")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      if (anyErr) return NextResponse.json({ error: anyErr.message }, { status: 500 });
      if ((anyRows ?? []).length > 0) {
        return NextResponse.json({ error: "no active agency membership" }, { status: 403 });
      }
      const provisioned = await provisionPersonalAgency(user.id);
      if ("response" in provisioned) return provisioned.response;
      agencyId = provisioned.agency_id;
      agency = { slug: provisioned.slug, name: provisioned.name };
    }

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
        agency_id: agencyId,
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
        agency_id: agencyId,
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
