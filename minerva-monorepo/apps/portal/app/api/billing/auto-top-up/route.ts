import { requireBillingCaller, unavailable } from "@/app/lib/billing-unavailable";

export const dynamic = "force-dynamic";

/** PATCH /api/billing/auto-top-up — auto-reload has no card to reload from behind this API. */
export async function PATCH(request: Request) {
  const rejected = await requireBillingCaller(request);
  if (rejected) return rejected;
  return unavailable("Auto-reload is configured on the portal website alongside the payment method it draws from.");
}
