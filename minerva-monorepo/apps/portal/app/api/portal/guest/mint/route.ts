import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateApiKey } from "@minerva/billing";

export const dynamic = "force-dynamic";

const DEFAULT_MINTS_PER_DAY = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const KEY_NAME_MAX = 80;

function serviceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error("Supabase service env missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  return createClient(url, service, { auth: { persistSession: false } });
}

function mintsPerDay(): number {
  const raw = Number.parseInt(process.env.MINERVA_GUEST_MINTS_PER_DAY ?? "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MINTS_PER_DAY;
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Salted hash: the throttle table must not become a log of visitor IPs. */
function ipHash(ip: string): string {
  const salt = process.env.MINERVA_GUEST_MINT_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "minerva-guest";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/** Device hint for the key listing; never trusted for anything. */
function keyName(request: NextRequest): string {
  const hinted = request.headers.get("x-minerva-client")?.trim();
  const label = hinted ? hinted.slice(0, 40) : "desktop";
  return `guest:${label}`.slice(0, KEY_NAME_MAX);
}

/**
 * Mint a free-tier-only router key for an unsigned device. No auth by design:
 * this is the "try Minerva" path. Containment lives in migration 036 -- the key
 * lands on the dedicated `guest` agency (plan 'free'), which the router already
 * gates to MINERVA_FREE_MODELS.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = serviceClient();
    const hash = ipHash(clientIp(request));
    const since = new Date(Date.now() - WINDOW_MS).toISOString();

    const { count, error: cErr } = await admin
      .from("portal_guest_mints")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", hash)
      .gte("created_at", since);
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

    const limit = mintsPerDay();
    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        { error: "guest limit reached", retry_after_hours: 24 },
        { status: 429, headers: { "retry-after": String(WINDOW_MS / 1000) } }
      );
    }

    const { data: guest, error: gErr } = await admin
      .from("agencies")
      .select("id")
      .eq("slug", "guest")
      .maybeSingle();
    if (gErr) return NextResponse.json({ error: gErr.message }, { status: 500 });
    if (!guest) {
      return NextResponse.json({ error: "guest agency missing (apply migration 036)" }, { status: 503 });
    }

    const gen = generateApiKey("server");
    const { data: key, error: kErr } = await admin
      .from("agency_api_keys")
      .insert({
        agency_id: (guest as { id: string }).id,
        name: keyName(request),
        purpose: "server",
        key_prefix: gen.prefix,
        key_last4: gen.last4,
        key_hash: gen.hash,
        // Guest keys are day credentials: the row must agree with the
        // lifetime the client is told, or a key the client considers dead
        // stays valid server-side indefinitely.
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();
    if (kErr || !key) return NextResponse.json({ error: kErr?.message ?? "key create failed" }, { status: 500 });

    const { error: mErr } = await admin.from("portal_guest_mints").insert({
      ip_hash: hash,
      key_id: (key as { id: string }).id,
    });
    // The throttle row is the point of this endpoint: without it the caller can
    // mint unbounded keys, so fail loudly rather than hand out a free key.
    if (mErr) {
      await admin.from("agency_api_keys").delete().eq("id", (key as { id: string }).id);
      return NextResponse.json({ error: mErr.message }, { status: 500 });
    }

    return NextResponse.json({ api_key: gen.token, plan: "free" }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("service env") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}