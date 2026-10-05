import { NextRequest, NextResponse } from "next/server";
import { randomToken, serviceClient, sha256Hex } from "../_lib";

export const dynamic = "force-dynamic";

const CLAIM_EXPIRES_SECONDS = 15 * 60;
const POLL_INTERVAL_SECONDS = 5;

/**
 * POST /api/anonymous/promotion-intent {token, user_code, device_code} —
 * begin upgrading a guest grant into a real account.
 *
 * The caller already started a normal device flow elsewhere (portal website,
 * desktop, CLI) and now links its anonymous grant to that flow's codes: when
 * a signed-in human approves the device, this grant is claimable as their
 * account and the client settles onto it. Returns `{claim_code, claim_url,
 * expires_in, interval}`; the `claim_code` is required by promotion-status.
 *
 * The grant itself is untouched here — intent is not consumption. A grant that
 * never completes still expires on its own clock.
 */
export async function POST(request: NextRequest) {
  let body: { token?: unknown; user_code?: unknown; device_code?: unknown };
  try {
    body = (await request.json()) as { token?: unknown; user_code?: unknown; device_code?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const userCode =
    typeof body.user_code === "string" ? body.user_code.trim().toUpperCase() : "";
  const deviceCode = typeof body.device_code === "string" ? body.device_code.trim() : "";
  if (!token.startsWith("anon_") || !userCode || !deviceCode) {
    return NextResponse.json({ error: "token, user_code and device_code are required" }, { status: 400 });
  }

  try {
    const admin = serviceClient();

    const { data: grant, error: gErr } = await admin
      .from("portal_anon_grants")
      .select("id, status, expires_at")
      .eq("grant_hash", sha256Hex(token))
      .maybeSingle();
    if (gErr) return NextResponse.json({ error: gErr.message }, { status: 500 });
    if (!grant) return NextResponse.json({ error: "unknown_token" }, { status: 404 });
    const row = grant as { id: string; status: string; expires_at: string };
    if (row.status !== "active" || new Date(row.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: "unknown_token" }, { status: 404 });
    }

    // The device flow must exist and still be pending: linking to a dead or
    // finished code would strand the claim in a state that can never complete.
    const { data: device, error: dErr } = await admin
      .from("portal_device_codes")
      .select("id, status, expires_at")
      .eq("device_code", deviceCode)
      .maybeSingle();
    if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 });
    if (!device) return NextResponse.json({ error: "unknown device code" }, { status: 404 });
    const flow = device as { status: string; expires_at: string };
    if (flow.status !== "pending" || new Date(flow.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: "device flow is no longer pending" }, { status: 410 });
    }

    const claimCode = randomToken("claim", 24);
    const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://portal.abbble.co.za").trim().replace(/\/+$/, "");
    const { error: uErr } = await admin
      .from("portal_anon_grants")
      .update({
        claim_code: claimCode,
        claim_device_code: deviceCode,
        claim_status: "pending",
      })
      .eq("id", row.id);
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

    return NextResponse.json(
      {
        claim_code: claimCode,
        // The human approves at the same device page they would use for any
        // sign-in; the user_code identifies the flow to them.
        claim_url: `${site}/device?code=${encodeURIComponent(userCode)}`,
        expires_in: CLAIM_EXPIRES_SECONDS,
        interval: POLL_INTERVAL_SECONDS,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("service env") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
