import type { SubscriptionStateResponse } from '@hermes/shared/billing'

import { hasPremiumAccess } from '@/lib/entitlement'
import { setComposerDraft } from '@/store/composer'
import { $activeGatewayProfile, newSessionInProfile } from '@/store/profile'

import type { IdeaCard } from './data'

/**
 * Launch an idea: open a fresh session and pre-fill the composer with the
 * card's starter. The user reviews and sends — nothing executes on click.
 * Starters beginning with `/` execute through the standard slash-dispatch
 * path on send; there is deliberately no second dispatch mechanism.
 *
 * Dependencies are injected so the dispatch is unit-testable without stores.
 */
export interface LauncherDeps {
  activeProfile: () => string
  openSession: (profile: string) => void
  setDraft: (text: string) => void
}

export const liveLauncherDeps: LauncherDeps = {
  activeProfile: () => $activeGatewayProfile.get(),
  openSession: (profile: string) => newSessionInProfile(profile),
  setDraft: (text: string) => setComposerDraft(text),
}

export function launchIdea(card: { starter: string }, deps: LauncherDeps = liveLauncherDeps): void {
  deps.openSession(deps.activeProfile())
  deps.setDraft(card.starter)
}

/** Whether this card is actionable for the given subscription state. */
export function isCardLocked(
  card: Pick<IdeaCard, 'premium'>,
  subscription: SubscriptionStateResponse | null | undefined
): boolean {
  return card.premium && !hasPremiumAccess(subscription)
}
