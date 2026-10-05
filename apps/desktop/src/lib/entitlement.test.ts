import { describe, expect, it } from 'vitest'
import { currentTierId, hasPremiumAccess, isPremiumTier } from './entitlement'
import type { SubscriptionStateResponse } from '@hermes/shared/billing'

function subscription(overrides: Partial<SubscriptionStateResponse> = {}): SubscriptionStateResponse {
  return {
    ok: true,
    logged_in: true,
    is_admin: false,
    can_change_plan: false,
    ...overrides,
  } as SubscriptionStateResponse
}

describe('isPremiumTier', () => {
  it.each(['plus', 'super', 'ultra', 'agency'])('grants %s', tier => {
    expect(isPremiumTier(tier)).toBe(true)
  })

  it.each(['free', '', 'enterprise', 'PLUS-PLUS', null, undefined])('denies %s', tier => {
    expect(isPremiumTier(tier as string)).toBe(false)
  })

  it('is case- and whitespace-tolerant', () => {
    expect(isPremiumTier('  Plus ')).toBe(true)
  })

  it('denies unknown tiers (fail closed)', () => {
    expect(isPremiumTier('ultra-plus')).toBe(false)
  })
})

describe('currentTierId', () => {
  it('prefers current.tier_id', () => {
    expect(currentTierId(subscription({ current: { tier_id: 'plus' } as never }))).toBe('plus')
  })

  it('falls back to the is_current tier', () => {
    expect(
      currentTierId(
        subscription({ tiers: [{ tier_id: 'super', is_current: true }, { tier_id: 'free', is_current: false }] as never })
      )
    ).toBe('super')
  })

  it('returns null when unresolvable', () => {
    expect(currentTierId(subscription())).toBeNull()
    expect(currentTierId(null)).toBeNull()
  })
})

describe('hasPremiumAccess', () => {
  it('grants a logged-in paid tier', () => {
    expect(hasPremiumAccess(subscription({ current: { tier_id: 'super' } as never }))).toBe(true)
  })

  it('denies logged-out state even with a tier present', () => {
    expect(hasPremiumAccess(subscription({ logged_in: false, current: { tier_id: 'super' } as never }))).toBe(false)
  })

  it('denies free and missing subscriptions', () => {
    expect(hasPremiumAccess(subscription({ current: { tier_id: 'free' } as never }))).toBe(false)
    expect(hasPremiumAccess(null)).toBe(false)
  })
})
