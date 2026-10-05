/**
 * TypeScript mirror of `hermes_cli/intake.py`. The Python dataclass is the
 * source of truth; this file must accept everything it emits and reject
 * everything it would reject. Panes (Feeds, PRDs, Goals) read these shapes;
 * they never construct intake events (construction is backend-side).
 */

export type IntakeAttachmentKind = 'image' | 'audio' | 'file'

export interface IntakeAttachment {
  kind: IntakeAttachmentKind
  mime: string
  bytes_ref: string
  transcript: string
  summary: string
}

export interface IntakeEvent {
  id: string
  source: string
  author_id: string | null
  author_name: string | null
  timestamp: string
  text: string
  attachments: IntakeAttachment[]
  conversation_id: string | null
  thread_context: string[]
}

const ATTACHMENT_KINDS: ReadonlySet<string> = new Set(['image', 'audio', 'file'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isIntakeAttachment(value: unknown): value is IntakeAttachment {
  if (!isRecord(value)) return false
  return (
    typeof value.kind === 'string' &&
    ATTACHMENT_KINDS.has(value.kind) &&
    typeof value.mime === 'string' &&
    value.mime !== '' &&
    typeof value.bytes_ref === 'string' &&
    value.bytes_ref !== '' &&
    typeof value.transcript === 'string' &&
    typeof value.summary === 'string'
  )
}

export function isIntakeEvent(value: unknown): value is IntakeEvent {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    value.id !== '' &&
    typeof value.source === 'string' &&
    value.source !== '' &&
    (value.author_id === null || typeof value.author_id === 'string') &&
    (value.author_name === null || typeof value.author_name === 'string') &&
    typeof value.timestamp === 'string' &&
    typeof value.text === 'string' &&
    Array.isArray(value.attachments) &&
    value.attachments.every(isIntakeAttachment) &&
    (value.conversation_id === null || typeof value.conversation_id === 'string') &&
    Array.isArray(value.thread_context) &&
    value.thread_context.every(item => typeof item === 'string')
  )
}
