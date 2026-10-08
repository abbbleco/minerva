import type { SubscriptionStateResponse } from '@hermes/shared/billing'
import { describe, expect, it } from 'vitest'

import { isCardLocked, type LauncherDeps, launchIdea } from './launcher'

function deps(): LauncherDeps & { calls: string[] } {
  const calls: string[] = []

  return {
    calls,
    activeProfile: () => 'default',
    openSession: (profile: string) => {
      calls.push(`open:${profile}`)
    },
    setDraft: (text: string) => {
      calls.push(`draft:${text}`)
    },
  }
}

function subscription(loggedIn: boolean, tierId: string | null): SubscriptionStateResponse {
  return { logged_in: loggedIn, current: tierId ? { tier_id: tierId } : undefined } as SubscriptionStateResponse
}

describe('launchIdea', () => {
  it('opens a session in the active profile, then pre-fills the draft — in that order', () => {
    const d = deps()
    launchIdea({ starter: 'Help me with: ' }, d)
    expect(d.calls).toEqual(['open:default', 'draft:Help me with: '])
  })

  it('passes slash starters through untouched for standard dispatch on send', () => {
    const d = deps()
    launchIdea({ starter: '/help' }, d)
    expect(d.calls).toEqual(['open:default', 'draft:/help'])
  })
})

describe('isCardLocked', () => {
  it('never locks free cards', () => {
    expect(isCardLocked({ premium: false }, null)).toBe(false)
    expect(isCardLocked({ premium: false }, subscription(false, null))).toBe(false)
  })

  it('locks premium cards for free and logged-out states', () => {
    expect(isCardLocked({ premium: true }, null)).toBe(true)
    expect(isCardLocked({ premium: true }, subscription(true, 'free'))).toBe(true)
    expect(isCardLocked({ premium: true }, subscription(false, 'super'))).toBe(true)
  })

  it('unlocks premium cards for paid tiers', () => {
    expect(isCardLocked({ premium: true }, subscription(true, 'super'))).toBe(false)
  })
})

describe('liveLauncherDeps', () => {
  it('is the shape launchIdea expects', async () => {
    const { liveLauncherDeps } = await import('./launcher')
    expect(typeof liveLauncherDeps.activeProfile).toBe('function')
    expect(typeof liveLauncherDeps.openSession).toBe('function')
    expect(typeof liveLauncherDeps.setDraft).toBe('function')
  })
})
