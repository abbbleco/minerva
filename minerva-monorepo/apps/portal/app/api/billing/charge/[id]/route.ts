import { requireBillingCaller, unavailable } from "@/app/lib/billing-unavailable";

export const dynamic = "force-dynamic";

/** GET /api/billing/charge/[id] — no charges exist behind this API, so none can be polled. */
export async function GET(request: Request) {
  const rejected = await requireBillingCaller(request);
  if (rejected) return rejected;
  return unavailable("Charge polling is unavailable: charges are created on the portal website, not through this API.");
}
