import type { SubscriptionStateResponse } from '@hermes/shared/billing'

/**
 * Premium entitlement for the flagship surfaces (Feeds, Ideas, Goals, PRDs,
 * form intake). One resolver, used by every feature.
 *
 * A tier is premium when it is a paid plan. The free tier and logged-out state
 * are never premium; unknown tier ids fail closed (deny) rather than open, so
 * a new tier the client has not heard of cannot silently unlock paid surfaces.
 *
 * This answers "may the user SEE it". Enforcement lives server-side: every
 * premium RPC re-checks via the backend twin of this helper
 * (`hermes_cli/nous_billing.py::require_premium_tier`). Never gate on this
 * alone for anything that costs work.
 */
export const PREMIUM_TIERS: ReadonlySet<string> = new Set(['plus', 'super', 'ultra', 'agency'])

export function isPremiumTier(tierId: string | null | undefined): boolean {
  if (typeof tierId !== 'string') return false
  return PREMIUM_TIERS.has(tierId.trim().toLowerCase())
}

/** The active tier id, or null when logged out / free / unresolvable. */
export function currentTierId(subscription: SubscriptionStateResponse | null | undefined): string | null {
  const current = subscription?.current
  if (typeof current?.tier_id === 'string' && current.tier_id) return current.tier_id
  const flagged = subscription?.tiers?.find(tier => tier.is_current)
  if (typeof flagged?.tier_id === 'string' && flagged.tier_id) return flagged.tier_id
  return null
}

/** Convenience: premium check straight off a subscription response. */
export function hasPremiumAccess(subscription: SubscriptionStateResponse | null | undefined): boolean {
  if (!subscription || subscription.logged_in === false) return false
  return isPremiumTier(currentTierId(subscription))
}
