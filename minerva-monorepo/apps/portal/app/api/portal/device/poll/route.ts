import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { routerBaseUrl } from "@/app/lib/supabase-server";

export const dynamic = "force-dynamic";

function serviceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error("Supabase service env missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  return createClient(url, service, { auth: { persistSession: false } });
}

/**
 * Poll a device session. No auth — the high-entropy device_code IS the
 * capability. On first approved read the minted key is returned exactly once
 * and wiped; later reads report consumed without the key.
 */
export async function GET(request: NextRequest) {
  const deviceCode = new URL(request.url).searchParams.get("device_code")?.trim();
  if (!deviceCode) return NextResponse.json({ error: "device_code required" }, { status: 400 });
  try {
    const admin = serviceClient();
    const { data, error } = await admin
      .from("portal_device_codes")
      .select("id, status, expires_at, agency_id, key_id, key_token, consumed_at")
      .eq("device_code", deviceCode)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "unknown device code" }, { status: 404 });
    if (new Date(data.expires_at).getTime() <= Date.now() && data.status === "pending") {
      await admin.from("portal_device_codes").update({ status: "expired" }).eq("id", data.id);
      return NextResponse.json({ status: "expired" });
    }
    if (data.status === "pending") return NextResponse.json({ status: "pending" });
    if (data.status === "denied") return NextResponse.json({ status: "denied" });
    if (data.status === "expired") return NextResponse.json({ status: "expired" });
    if (data.status === "consumed" || data.consumed_at || !data.key_token) {
      return NextResponse.json({ status: "approved", consumed: true });
    }

    let agency: { slug: string; name: string } | null = null;
    if (data.agency_id) {
      const { data: row } = await admin
        .from("agencies")
        .select("slug, name")
        .eq("id", data.agency_id)
        .maybeSingle();
      agency = (row as { slug: string; name: string } | null) ?? null;
    }
    const apiKey = data.key_token as string;
    await admin
      .from("portal_device_codes")
      .update({ status: "consumed", key_token: null, consumed_at: new Date().toISOString() })
      .eq("id", data.id);
    return NextResponse.json({
      status: "approved",
      api_key: apiKey,
      router_url: `${routerBaseUrl()}/v1`,
      agency,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("service env") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
