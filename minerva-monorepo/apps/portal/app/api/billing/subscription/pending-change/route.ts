import { requireBillingCaller, unavailable } from "@/app/lib/billing-unavailable";

export const dynamic = "force-dynamic";

/** PUT /api/billing/subscription/pending-change — plan changes are a website flow. */
export async function PUT(request: Request) {
  const rejected = await requireBillingCaller(request);
  if (rejected) return rejected;
  return unavailable("Plan changes happen on the portal website at /manage-subscription, not through this API.");
}

/** DELETE /api/billing/subscription/pending-change — see PUT above. */
export async function DELETE(request: Request) {
  const rejected = await requireBillingCaller(request);
  if (rejected) return rejected;
  return unavailable("Plan changes happen on the portal website at /manage-subscription, not through this API.");
}
