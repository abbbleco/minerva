import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const EXPIRES_IN_SECONDS = 900;
const POLL_INTERVAL_SECONDS = 5;
const USER_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function serviceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error("Supabase service env missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  return createClient(url, service, { auth: { persistSession: false } });
}

function userCode(): string {
  const bytes = randomBytes(8);
  const part = (off: number) =>
    Array.from({ length: 4 }, (_, i) => USER_CODE_ALPHABET[bytes[(off + i) % bytes.length] % USER_CODE_ALPHABET.length]).join("");
  return `${part(0)}-${part(4)}`;
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://portal.abbble.co.za").trim().replace(/\/+$/, "");
}

/**
 * Begin a desktop/CLI sign-in: no auth. Returns a device_code (secret, for
 * polling) and a short user_code the human approves at /device while signed in.
 */
export async function POST() {
  try {
    const admin = serviceClient();
    for (let attempt = 0; attempt < 3; attempt++) {
      const deviceCode = `dev_${randomBytes(32).toString("base64url")}`;
      const code = userCode();
      const { error } = await admin.from("portal_device_codes").insert({
        device_code: deviceCode,
        user_code: code,
        status: "pending",
      });
      if (!error) {
        return NextResponse.json(
          {
            device_code: deviceCode,
            user_code: code,
            verification_url: `${siteUrl()}/device?code=${encodeURIComponent(code)}`,
            expires_in: EXPIRES_IN_SECONDS,
            interval: POLL_INTERVAL_SECONDS,
          },
          { status: 201 }
        );
      }
      // Unique collision on either code — retry with fresh entropy.
      if (!/duplicate|unique/i.test(error.message)) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ error: "could not mint device code, retry" }, { status: 503 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("service env") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
