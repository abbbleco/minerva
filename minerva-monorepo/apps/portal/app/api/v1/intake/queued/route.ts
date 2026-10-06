import { NextResponse } from "next/server";

import { handleQueuedGet, serviceClient, type IntakeAdmin } from "../_lib";

export const dynamic = "force-dynamic";

/** GET /api/v1/intake/queued — thin wrapper: service client, then the handler. */
export async function GET(request: Request) {
  let admin: IntakeAdmin;
  try {
    admin = serviceClient() as unknown as IntakeAdmin;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 503 });
  }
  return handleQueuedGet(admin, request);
}
