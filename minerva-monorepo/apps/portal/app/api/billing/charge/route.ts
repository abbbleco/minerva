import { requireBillingCaller, unavailable } from "@/app/lib/billing-unavailable";

export const dynamic = "force-dynamic";

/** POST /api/billing/charge — card top-ups are a website flow, not an API mutation. */
export async function POST(request: Request) {
  const rejected = await requireBillingCaller(request);
  if (rejected) return rejected;
  return unavailable(
    "Card top-ups happen on the portal website, where payment completes in the browser. This API is read-only."
  );
}
