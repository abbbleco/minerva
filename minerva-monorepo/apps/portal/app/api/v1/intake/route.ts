import { NextResponse } from "next/server";

import { handleIntakePost, serviceClient, type IntakeAdmin } from "./_lib";

export const dynamic = "force-dynamic";

/** POST /api/v1/intake — thin wrapper: service client, then the handler. */
export async function POST(request: Request) {
  let admin: IntakeAdmin;
  try {
    admin = serviceClient() as unknown as IntakeAdmin;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 503 });
  }
  return handleIntakePost(admin, request);
}
