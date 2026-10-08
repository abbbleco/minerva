import {
  connectionScoped,
  hermesApi,
  profileScoped,
  STARTUP_REQUEST_TIMEOUT_MS
} from './client'

/**
 * PRDs API: the review queue for the PRDs pane — drafts awaiting human
 * review, the watch list, manual intake injection, and the explicit kanban
 * bridge. Mirrors `api/goals.ts`: profile-scoped reads, same timeout
 * posture. (File intake rides `POST /api/prds/intake/file` from API
 * clients; the pane injects pasted text — same pipeline either way.)
 */

export interface PrdHistoryEntry {
  at: number
  from_status: string
  to_status: string
  actor: string
  reason?: string
}

export interface PrdView {
  id: string
  title: string
  problem: string
  users: string
  requirements: string[]
  acceptance_criteria: string[]
  open_questions: string[]
  sources: string[]
  status: string
  history: PrdHistoryEntry[]
  section_sources: Record<string, string[]>
  conversation_id: string | null
  kanban_task_id: string | null
}

export interface PrdCaseView {
  id: string
  conversation_id: string
  status: string
  reason: string
  event_ids: string[]
  prd_id: string | null
  triage_count: number
  updated_at: number
}

export interface PrdIntakeEventView {
  id: string
  text: string
  conversation_id: string | null
}

export function getPrds(options?: { status?: string }): Promise<{ prds: PrdView[] }> {
  const params = new URLSearchParams()

  if (options?.status) {params.set('status', options.status)}
  const suffix = params.size ? `?${params}` : ''

  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: `/api/prds${suffix}`,
    timeoutMs: STARTUP_REQUEST_TIMEOUT_MS
  })
}

export function getPrd(prdId: string): Promise<{
  prd: PrdView
  case: PrdCaseView | null
  events: PrdIntakeEventView[]
}> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: `/api/prds/${encodeURIComponent(prdId)}`,
    timeoutMs: STARTUP_REQUEST_TIMEOUT_MS
  })
}

export function getPrdCases(options?: { status?: string }): Promise<{ cases: PrdCaseView[] }> {
  const params = new URLSearchParams()

  if (options?.status) {params.set('status', options.status)}
  const suffix = params.size ? `?${params}` : ''

  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: `/api/prds-cases${suffix}`,
    timeoutMs: STARTUP_REQUEST_TIMEOUT_MS
  })
}

export function injectPrdIntake(body: {
  text: string
  conversation_id?: string
  source?: string
}): Promise<{ event_id: string; conversation_id: string; case: PrdCaseView | null }> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: '/api/prds/intake',
    method: 'POST',
    body
  })
}

export function reviewPrd(
  prdId: string,
  body: { action: string; reason?: string; field?: string; value?: unknown }
): Promise<{ prd: PrdView }> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: `/api/prds/${encodeURIComponent(prdId)}/review`,
    method: 'POST',
    body
  })
}

export function dispatchPrd(prdId: string): Promise<{
  task_id: string
  created: boolean
  child_ids: string[]
}> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: `/api/prds/${encodeURIComponent(prdId)}/dispatch`,
    method: 'POST'
  })
}
