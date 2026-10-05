import { describe, expect, it } from 'vitest'

import { IDEA_CARDS } from './data'
import { IDEAS_LOCALES } from './i18n'

/**
 * Content completeness: every card id in data must carry title, pitch and
 * starter copy in the English bundle. Locales may omit cards (the fallback
 * chain resolves them from `en`); English may not, because it IS the floor.
 */
describe('ideas English content completeness', () => {
  const en = IDEAS_LOCALES.en as {
    cards: Record<string, { title?: string; pitch?: string; starter?: string }>
  } | undefined
  if (!en) throw new Error('en bundle missing')

  for (const card of IDEA_CARDS) {
    it(`covers ${card.id}`, () => {
      const copy = en.cards[card.id]
      expect(copy, `missing cards.${card.id} in en bundle`).toBeDefined()
      for (const field of ['title', 'pitch', 'starter'] as const) {
        const text = copy?.[field]
        expect(typeof text === 'string' && text.trim() !== '', `cards.${card.id}.${field} must be non-blank`).toBe(true)
      }
    })
  }

  it('covers every category label', () => {
    const categories = (IDEAS_LOCALES.en as { categories: Record<string, { label?: string }> }).categories
    const used = new Set(IDEA_CARDS.map(card => card.category))
    for (const category of used) {
      expect(categories[category]?.label?.trim(), `missing categories.${category}.label`).toBeTruthy()
    }
  })
})
