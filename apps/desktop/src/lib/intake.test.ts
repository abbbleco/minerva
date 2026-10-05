import { describe, expect, it } from 'vitest'
import { isIntakeAttachment, isIntakeEvent } from './intake'

const attachment = {
  kind: 'image',
  mime: 'image/png',
  bytes_ref: '/tmp/a.png',
  transcript: '',
  summary: '',
}

const event = {
  id: 'evt1',
  source: 'telegram',
  author_id: 'u1',
  author_name: 'Ada',
  timestamp: '2026-10-05T12:00:00+00:00',
  text: 'please add dark mode',
  attachments: [attachment],
  conversation_id: 'm1',
  thread_context: ['earlier'],
}

describe('isIntakeEvent', () => {
  it('accepts a well-formed event', () => {
    expect(isIntakeEvent(event)).toBe(true)
  })

  it('accepts minimal events (nulls, empty lists)', () => {
    expect(
      isIntakeEvent({ ...event, author_id: null, author_name: null, conversation_id: null, attachments: [], thread_context: [] })
    ).toBe(true)
  })

  it.each([
    ['missing id', { ...event, id: '' }],
    ['missing source', { ...event, source: '' }],
    ['bad attachment', { ...event, attachments: [{ ...attachment, kind: 'video' }] }],
    ['non-string thread item', { ...event, thread_context: [42] }],
    ['not an object', 'evt1'],
    ['null', null],
  ])('rejects %s', (_label, value) => {
    expect(isIntakeEvent(value)).toBe(false)
  })
})

describe('isIntakeAttachment', () => {
  it('accepts a well-formed attachment', () => {
    expect(isIntakeAttachment(attachment)).toBe(true)
  })

  it.each([['unknown kind', { ...attachment, kind: 'video' }], ['empty ref', { ...attachment, bytes_ref: '' }]])(
    'rejects %s',
    (_label, value) => {
      expect(isIntakeAttachment(value)).toBe(false)
    }
  )
})
