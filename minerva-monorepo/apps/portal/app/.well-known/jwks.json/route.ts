import { NextResponse } from "next/server";
import { jwksDocument } from "@/app/lib/oauth-jwt";

export const dynamic = "force-dynamic";

/**
 * GET /.well-known/jwks.json — the public signing keys for the portal's OAuth
 * access tokens.
 *
 * Served to anyone: a public key is public. Clients (the dashboard plugin,
 * cron verification) fetch this to verify token signatures without ever
 * holding a secret. Long-lived cache is safe — rotation is additive (a new kid
 * appears beside the old one) and this document changes only when that happens.
 */
export async function GET() {
  try {
    return NextResponse.json(jwksDocument(), {
      headers: { "cache-control": "public, max-age=3600" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
