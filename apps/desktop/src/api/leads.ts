import {
  connectionScoped,
  hermesApi,
  profileScoped,
  STARTUP_REQUEST_TIMEOUT_MS
} from './client'

/**
 * LEADS API: the human-contacts directory for the LEADS pane — derived
 * contacts across messaging channels and form intake, recent messages per
 * contact, mute/pin/note overrides, and the reply box. Mirrors `api/goals.ts`:
 * profile-scoped reads, same timeout posture. Replies send as the connected
 * bot account; the backend resolves the target from its own session rows.
 */

export interface LeadChannelView {
  platform: string
  chat_type: string
  chat_id: string
  thread_id: string | null
  scope_id: string | null
  session_key: string
  last_active: number
}

export interface LeadAlsoOn {
  contact_id: string
  display_name: string
  via: string
}

export interface LeadMergedRef {
  contact_id: string
  display_name: string
}

export interface LeadContactView {
  id: string
  display_name: string
  platform: string
  channels: LeadChannelView[]
  emails: string[]
  phones: string[]
  first_seen_at: number
  last_seen_at: number
  snippet: string
  snippet_at: number
  unread: number
  muted: boolean
  pinned: boolean
  note: string
  also_on: LeadAlsoOn[]
  merged_into: string | null
  merged_from: LeadMergedRef[]
}

export interface LeadMessageView {
  role: string
  text: string
  timestamp: number
}

export function getLeads(options?: {
  platform?: string
  include_muted?: boolean
}): Promise<{ contacts: LeadContactView[] }> {
  const params = new URLSearchParams()

  if (options?.platform) {params.set('platform', options.platform)}

  if (options?.include_muted) {params.set('include_muted', 'true')}
  const suffix = params.size ? `?${params}` : ''

  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: `/api/leads${suffix}`,
    timeoutMs: STARTUP_REQUEST_TIMEOUT_MS
  })
}

export function getLead(contactId: string): Promise<{
  contact: LeadContactView
  messages: LeadMessageView[]
}> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: `/api/leads/${encodeURIComponent(contactId)}`,
    timeoutMs: STARTUP_REQUEST_TIMEOUT_MS
  })
}

export function patchLead(
  contactId: string,
  body: { muted?: boolean; pinned?: boolean; note?: string; merged_into?: string }
): Promise<{ override: Record<string, unknown>; contact: LeadContactView | null }> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: `/api/leads/${encodeURIComponent(contactId)}`,
    method: 'PATCH',
    body
  })
}

export function replyLead(contactId: string, text: string): Promise<{
  ok: boolean
  contact_id: string
  platform: string
  chat_id: string
}> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: '/api/leads/reply',
    method: 'POST',
    body: { contact_id: contactId, text }
  })
}

export function getLeadIntake(contactId: string): Promise<{
  events: Array<{ id: string | null; text: string; conversation_id: string | null }>
}> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: `/api/leads/${encodeURIComponent(contactId)}/intake`,
    timeoutMs: STARTUP_REQUEST_TIMEOUT_MS
  })
}
