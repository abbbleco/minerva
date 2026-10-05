import { NextRequest, NextResponse } from "next/server";
import { serviceClient } from "../_lib";

export const dynamic = "force-dynamic";

/**
 * POST /api/anonymous/promotion-status {claim_code} — has the linked device
 * flow been approved yet?
 *
 * Returns `{status}` where status is `pending` (still waiting),
 * `completed` (the device was approved — the client now settles onto the
 * real account through its normal upgrade path), `denied`, or `expired`.
 * Unknown claim codes are 404, which the client treats as terminal: there is
 * no promotion to wait for.
 *
 * Completion is observed, not performed, here: the device approval itself
 * mints the real credential through the normal device flow, and the client's
 * settlement moves its config over. This endpoint only reports the device's
 * state so the poller knows when to make that move.
 */
export async function POST(request: NextRequest) {
  let body: { claim_code?: unknown };
  try {
    body = (await request.json()) as { claim_code?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const claimCode = typeof body.claim_code === "string" ? body.claim_code.trim() : "";
  if (!claimCode) {
    return NextResponse.json({ error: "claim_code is required" }, { status: 400 });
  }

  try {
    const admin = serviceClient();
    const { data: grant, error: gErr } = await admin
      .from("portal_anon_grants")
      .select("id, claim_device_code, claim_status, expires_at")
      .eq("claim_code", claimCode)
      .maybeSingle();
    if (gErr) return NextResponse.json({ error: gErr.message }, { status: 500 });
    if (!grant) return NextResponse.json({ error: "unknown claim" }, { status: 404 });

    const row = grant as {
      id: string;
      claim_device_code: string | null;
      claim_status: string | null;
      expires_at: string;
    };
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      await admin.from("portal_anon_grants").update({ claim_status: "expired" }).eq("id", row.id);
      return NextResponse.json({ status: "expired" });
    }
    if (!row.claim_device_code) {
      return NextResponse.json({ status: "pending" });
    }

    const { data: device } = await admin
      .from("portal_device_codes")
      .select("status, expires_at")
      .eq("device_code", row.claim_device_code)
      .maybeSingle();
    const flow = device as { status: string; expires_at: string } | null;
    if (!flow) return NextResponse.json({ status: "expired" });

    if (flow.status === "approved" || flow.status === "consumed") {
      if (row.claim_status !== "completed") {
        await admin.from("portal_anon_grants").update({ claim_status: "completed" }).eq("id", row.id);
      }
      return NextResponse.json({ status: "completed" });
    }
    if (flow.status === "denied") {
      await admin.from("portal_anon_grants").update({ claim_status: "denied" }).eq("id", row.id);
      return NextResponse.json({ status: "denied" });
    }
    if (flow.status === "expired" || new Date(flow.expires_at).getTime() <= Date.now()) {
      await admin.from("portal_anon_grants").update({ claim_status: "expired" }).eq("id", row.id);
      return NextResponse.json({ status: "expired" });
    }
    return NextResponse.json({ status: "pending" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("service env") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
