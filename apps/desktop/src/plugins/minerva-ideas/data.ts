/**
 * Ideas catalog structure. Verbal content (title, pitch, starter) lives in
 * the plugin locale bundles keyed by card id (`cards.<id>.title` etc.) so
 * every word localizes; this file holds only non-verbal structure.
 *
 * Launch is uniform by design: every card opens a fresh session with its
 * starter text pre-filled in the composer draft. The user reviews and sends.
 * Starters beginning with `/` execute through the standard slash-dispatch
 * path on send — there is deliberately no second dispatch mechanism.
 */

export type IdeaDifficulty = 'starter' | 'intermediate' | 'advanced'

export type IdeaCategory =
  | 'write'
  | 'code'
  | 'research'
  | 'organize'
  | 'communicate'
  | 'learn'
  | 'automate'
  | 'analyze'

export interface IdeaCard {
  /** Stable key; locale bundles carry `cards.<id>.title/pitch/starter`. */
  id: string
  category: IdeaCategory
  difficulty: IdeaDifficulty
  /** Needs a capability beyond plain chat (displayed as a chip; not probed). */
  needs: string[]
  /** Premium-only cards render locked for free tiers with an upsell. */
  premium: boolean
}

export const IDEA_CATEGORIES: ReadonlyArray<IdeaCategory> = [
  'write',
  'code',
  'research',
  'organize',
  'communicate',
  'learn',
  'automate',
  'analyze',
]

export const IDEA_DIFFICULTIES: ReadonlyArray<IdeaDifficulty> = ['starter', 'intermediate', 'advanced']

export const IDEA_CARDS: ReadonlyArray<IdeaCard> = [
  { id: 'draft-email', category: 'write', difficulty: 'starter', needs: [], premium: false },
  { id: 'review-writing', category: 'write', difficulty: 'starter', needs: [], premium: false },
  { id: 'brainstorm', category: 'write', difficulty: 'starter', needs: [], premium: false },
  { id: 'explain-code', category: 'code', difficulty: 'starter', needs: [], premium: false },
  { id: 'debug-error', category: 'code', difficulty: 'intermediate', needs: [], premium: false },
  { id: 'learn-topic', category: 'learn', difficulty: 'starter', needs: [], premium: false },
  { id: 'meeting-prep', category: 'communicate', difficulty: 'starter', needs: [], premium: false },
  { id: 'summarize-thread', category: 'communicate', difficulty: 'intermediate', needs: [], premium: false },
  { id: 'research-brief', category: 'research', difficulty: 'intermediate', needs: ['web'], premium: true },
  { id: 'plan-project', category: 'organize', difficulty: 'intermediate', needs: [], premium: false },
  { id: 'analyze-data', category: 'analyze', difficulty: 'advanced', needs: [], premium: true },
  { id: 'automate-task', category: 'automate', difficulty: 'advanced', needs: ['cron'], premium: true },
]

/** Structural invariants: unique ids, known categories/difficulties. */
export function validateIdeasCatalog(cards: ReadonlyArray<IdeaCard> = IDEA_CARDS): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  for (const card of cards) {
    if (!card.id) problems.push('card with empty id')
    if (seen.has(card.id)) problems.push(`duplicate card id: ${card.id}`)
    seen.add(card.id)
    if (!IDEA_CATEGORIES.includes(card.category)) problems.push(`unknown category on ${card.id}`)
    if (!IDEA_DIFFICULTIES.includes(card.difficulty)) problems.push(`unknown difficulty on ${card.id}`)
  }
  return problems
}
