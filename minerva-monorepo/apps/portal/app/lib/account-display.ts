/**
 * Pure display rules for account/subscription UI (no React, no Next imports —
 * unit-tested under node:test; components consume these).
 */

export interface SessionUser {
  id: string;
  email?: string | null;
}

/** Display name for the welcome slot: email local-part, never the raw id. */
export function displayNameForSession(user: SessionUser | null): string | null {
  if (!user) return null;
  const email = (user.email ?? "").trim();
  if (!email) return null;
  const local = email.split("@")[0] ?? "";
  return local || null;
}

export interface PlanCard {
  id: string;
  cta: string;
}

export interface SubscriptionSnapshot {
  logged_in: boolean;
  current: { tier_id: string; name: string; monthly_credits: number } | null;
}

export interface PlanAction {
  kind: "link" | "current" | "loading";
  text: string;
  href?: string;
}

/** CTA for one tier given the subscription. */
export function planActionForTier(
  plan: Pick<PlanCard, "id" | "cta">,
  subscription: SubscriptionSnapshot | null,
): PlanAction {
  if (!subscription || !subscription.logged_in || !subscription.current) {
    return { kind: "link", text: "Subscribe", href: "/signup" };
  }
  if (plan.id.toLowerCase() === subscription.current.tier_id.toLowerCase()) {
    return { kind: "current", text: "Current plan" };
  }
  // The hub preselects from ?plan= and hosts the Paystack checkout.
  const hub = `/manage-subscription?plan=${encodeURIComponent(plan.id)}`;
  if (subscription.current.tier_id.toLowerCase() === "free") {
    return { kind: "link", text: plan.cta, href: hub };
  }
  return { kind: "link", text: "Switch plan", href: hub };
}
