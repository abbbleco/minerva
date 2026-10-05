import { describe, expect, it } from 'vitest'
import { isPrdDocument, isPrdTransition } from './prd'

const transition = { at: 1728120000, from_status: '', to_status: 'draft', actor: 'triage', reason: 'created by triage' }

const document = {
  id: 'prd1',
  title: 'Dark mode',
  problem: 'The app blinds users at night.',
  users: 'Night owls',
  requirements: ['r1'],
  acceptance_criteria: ['c1'],
  open_questions: ['q1'],
  sources: ['evt1'],
  status: 'in_review',
  history: [transition, { ...transition, from_status: 'draft', to_status: 'in_review', actor: 'reviewer:ada' }],
}

describe('isPrdDocument', () => {
  it('accepts a well-formed document', () => {
    expect(isPrdDocument(document)).toBe(true)
  })

  it.each([
    ['blank title', { ...document, title: '  ' }],
    ['blank problem', { ...document, problem: '' }],
    ['no sources', { ...document, sources: [] }],
    ['bad status', { ...document, status: 'shipped' }],
    ['bad history entry', { ...document, history: [{ ...transition, at: 'now' }] }],
  ])('rejects %s', (_label, value) => {
    expect(isPrdDocument(value)).toBe(false)
  })
})

describe('isPrdTransition', () => {
  it('accepts a well-formed transition', () => {
    expect(isPrdTransition(transition)).toBe(true)
  })

  it('rejects non-numeric timestamps', () => {
    expect(isPrdTransition({ ...transition, at: 'now' })).toBe(false)
  })
})
