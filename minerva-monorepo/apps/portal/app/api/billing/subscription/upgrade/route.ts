import { requireBillingCaller, unavailable } from "@/app/lib/billing-unavailable";

export const dynamic = "force-dynamic";

/** POST /api/billing/subscription/upgrade — upgrades complete payment on the website. */
export async function POST(request: Request) {
  const rejected = await requireBillingCaller(request);
  if (rejected) return rejected;
  return unavailable("Upgrades complete payment on the portal website at /manage-subscription, not through this API.");
}
