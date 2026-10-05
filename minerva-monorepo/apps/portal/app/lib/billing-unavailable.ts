import { NextResponse } from "next/server";
import { portalBase, resolveAgencyContext } from "@/app/lib/agency-billing";

export const dynamic = "force-dynamic";

/**
 * Explicit "not implemented" for billing mutations the portal does not offer
 * through this API.
 *
 * There is no card processor behind these endpoints: top-ups and plan changes
 * happen on the portal website (`/manage-subscription`), where the human is
 * present to complete payment. Returning a typed `endpoint_unavailable`
 * refusal — instead of letting the request fall through to Next.js's generic
 * 404 HTML — is what lets the backend (`hermes_cli/nous_billing.py`) and the
 * desktop map it to the "go to the portal" action instead of a crash.
 *
 * The credential is still validated first: an unauthenticated caller learns
 * nothing about billing, not even that the endpoint is unavailable.
 */
export function unavailable(message: string) {
  return NextResponse.json(
    {
      error: "endpoint_unavailable",
      message,
      portal_url: portalBase(),
    },
    { status: 501 }
  );
}

export async function requireBillingCaller(request: Request): Promise<null | NextResponse> {
  try {
    const context = await resolveAgencyContext(request);
    if (!context) {
      return NextResponse.json({ ok: false, logged_in: false, error: "not provisioned" }, { status: 401 });
    }
    return null;
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    const detail = error instanceof Error ? error.message : String(error);
    if (status === 401) {
      return NextResponse.json({ ok: false, logged_in: false, error: detail }, { status });
    }
    return NextResponse.json({ ok: false, error: detail }, { status: 502 });
  }
}
