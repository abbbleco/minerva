import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export function serviceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error("Supabase service env missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  return createClient(url, service, { auth: { persistSession: false } });
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function randomToken(prefix: string, bytes = 24): string {
  return `${prefix}_${randomBytes(bytes).toString("base64url")}`;
}

export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Salted hash: throttle tables must not become logs of visitor IPs. */
export function ipHash(ip: string): string {
  const salt = process.env.MINERVA_GUEST_MINT_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "minerva-guest";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function routerBaseUrl(): string {
  const raw =
    process.env.MINERVA_ROUTER_URL ??
    process.env.NEXT_PUBLIC_MINERVA_ROUTER_URL ??
    "https://minrouter.abbbleco.workers.dev";
  return raw.trim().replace(/\/+$/, "");
}
