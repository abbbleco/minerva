import { requireBillingCaller, unavailable } from "@/app/lib/billing-unavailable";

export const dynamic = "force-dynamic";

/** POST /api/billing/subscription/preview — plan previews live on the website's checkout flow. */
export async function POST(request: Request) {
  const rejected = await requireBillingCaller(request);
  if (rejected) return rejected;
  return unavailable("Plan previews are part of the website checkout at /manage-subscription, not this API.");
}
