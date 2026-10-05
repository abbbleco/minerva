import { describe, expect, it } from 'vitest'

import { IDEA_CARDS, validateIdeasCatalog } from './data'

/**
 * Content completeness invariants: every card the data file lists must be
 * fully specified, and the catalog must stay structurally clean as cards are
 * added. Copy itself (title/pitch/starter per locale) is covered by the i18n
 * completeness test alongside; this file owns structure.
 */
describe('validateIdeasCatalog', () => {
  it('accepts the shipped catalog with zero problems', () => {
    expect(validateIdeasCatalog(IDEA_CARDS)).toEqual([])
  })

  it('ships a meaningful number of cards', () => {
    expect(IDEA_CARDS.length).toBeGreaterThanOrEqual(8)
  })

  it('rejects duplicate ids', () => {
    expect(validateIdeasCatalog([...IDEA_CARDS, IDEA_CARDS[0]!])).toContain(
      `duplicate card id: ${IDEA_CARDS[0]!.id}`
    )
  })

  it('rejects unknown categories and difficulties', () => {
    expect(
      validateIdeasCatalog([{ ...IDEA_CARDS[0]!, category: 'teleport' as never }]).some(problem =>
        problem.includes('unknown category')
      )
    ).toBe(true)
    expect(
      validateIdeasCatalog([{ ...IDEA_CARDS[0]!, difficulty: 'expert' as never }]).some(problem =>
        problem.includes('unknown difficulty')
      )
    ).toBe(true)
  })

  it('keeps at least one free card (the panel is never all-locked)', () => {
    expect(IDEA_CARDS.some(card => !card.premium)).toBe(true)
  })
})
