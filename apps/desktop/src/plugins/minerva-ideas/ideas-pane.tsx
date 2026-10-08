import type { SubscriptionStateResponse } from '@hermes/shared/billing'
import { useMemo, useState } from 'react'

import { useSubscriptionState } from '@/app/settings/billing/use-billing-state'
import { requestBillingSettings } from '@/store/billing-block'

import { IDEA_CARDS, type IdeaCard } from './data'
import { useIdeas } from './i18n'
import { isCardLocked, launchIdea } from './launcher'

/**
 * Ideas pane: a gallery of what users can do with Minerva. Each card opens a
 * fresh session with its starter pre-filled in the composer — the user reviews
 * and sends. Nothing executes on click.
 *
 * Premium cards render locked for free tiers; the lock opens billing settings
 * through the shared recovery action so the upsell behaves identically to
 * every other billing wall in the app.
 */
export function IdeasPane() {
  const ideas = useIdeas()
  const [query, setQuery] = useState('')
  const subscription = useSubscriptionState()

  const subscriptionData: SubscriptionStateResponse | null =
    subscription.data?.ok ? subscription.data.data : null

  const visible = useMemo(() => {    const q = query.trim().toLowerCase()

    if (!q) {return IDEA_CARDS}

    return IDEA_CARDS.filter(card => {
      const copy = ideas.cards[card.id]

      if (!copy) {return false}

      return (
        copy.title.toLowerCase().includes(q) ||
        copy.pitch.toLowerCase().includes(q) ||
        card.category.toLowerCase().includes(q)
      )
    })
  }, [query, ideas])

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-3">
      <input
        aria-label={ideas.pane.searchPlaceholder}
        className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm"
        onChange={event => setQuery(event.target.value)}
        placeholder={ideas.pane.searchPlaceholder}
        type="search"
        value={query}
      />
      {visible.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm font-medium">{query ? ideas.pane.noMatch(query) : ideas.pane.emptyTitle}</p>
          {!query && <p className="text-xs opacity-60">{ideas.pane.emptyDesc}</p>}
        </div>
      ) : (
        <div className="grid gap-2">
          {visible.map(card => (
            <IdeaRow card={card} key={card.id} subscription={subscriptionData} />
          ))}
        </div>
      )}
    </div>
  )
}

function IdeaRow({ card, subscription }: { card: IdeaCard; subscription: SubscriptionStateResponse | null }) {
  const ideas = useIdeas()
  const copy = ideas.cards[card.id]

  // A card without copy in the active locale is a content bug, not a render
  // crash: the English fallback in `useIdeas` covers it, and this guard covers
  // a card id missing even there (added to data but never translated).
  if (!copy) {return null}
  const category = ideas.categories[card.category]
  const locked = isCardLocked(card, subscription)

  return (
    <div className="flex flex-col gap-1.5 rounded border border-white/10 bg-white/[0.03] p-2.5">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-medium">{copy.title}</p>
        {card.premium && (
          <span className="rounded bg-white/10 px-1 py-px font-mono text-[10px] uppercase">
            {ideas.pane.premiumLocked}
          </span>
        )}
      </div>
      <p className="text-xs opacity-70">{copy.pitch}</p>
      <div className="flex items-center gap-1 text-[11px] opacity-60">
        {category && <span>{category.label}</span>}
        <span>·</span>
        <span>{card.difficulty}</span>
        {card.needs.map(need => (
          <span key={need}>· {need}</span>
        ))}
      </div>
      {locked ? (
        <button
          className="mt-1 w-full rounded border border-white/15 px-2 py-1 text-xs"
          onClick={() => requestBillingSettings()}
          type="button"
        >
          {ideas.pane.premiumLocked} — {ideas.pane.tryIt}
        </button>
      ) : (
        <button
          className="mt-1 w-full rounded border border-white/15 px-2 py-1 text-xs"
          onClick={() => launchIdea({ starter: copy.starter })}
          type="button"
        >
          {ideas.pane.tryIt}
        </button>
      )}
    </div>
  )
}
