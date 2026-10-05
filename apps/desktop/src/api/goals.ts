import {
  connectionScoped,
  hermesApi,
  profileScoped,
  STARTUP_REQUEST_TIMEOUT_MS
} from './client'

/**
 * Goals API: the tracked-goal registry for the Goals pane — plural named goals
 * per profile, their audit history, the confirmation inbox for proposed
 * completions, and the explicit kanban bridge. Mirrors `api/feeds.ts`:
 * profile-scoped reads, same timeout posture.
 */

export interface GoalHistoryEntry {
  ts: number
  trigger: string
  detail?: string
  evidence?: string
}

export interface GoalView {
  id: string
  title: string
  contract: Record<string, string>
  status: string
  session_id: string | null
  kanban_task_id: string | null
  created_at: number
  updated_at: number
  history?: GoalHistoryEntry[]
}

export interface GoalsList {
  goals: GoalView[]
  statuses: string[]
  pending: string[]
}

export function getGoals(options?: { status?: string; profile?: string }): Promise<GoalsList> {
  const params = new URLSearchParams()
  if (options?.profile) params.set('profile', options.profile)
  if (options?.status) params.set('status', options.status)
  const suffix = params.size ? `?${params}` : ''
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: `/api/goals${suffix}`,
    timeoutMs: STARTUP_REQUEST_TIMEOUT_MS
  })
}

export function createGoal(body: {
  title: string
  contract?: Record<string, string>
}): Promise<{ goal: GoalView }> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: '/api/goals',
    method: 'POST',
    body
  })
}

export function getGoal(goalId: string): Promise<{ goal: GoalView }> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: `/api/goals/${encodeURIComponent(goalId)}`,
    timeoutMs: STARTUP_REQUEST_TIMEOUT_MS
  })
}

/** Every lifecycle action shares one response shape. */
export interface GoalActionResponse {
  ok: boolean
  action: string
  goal: GoalView
}

function goalAction(goalId: string, verb: string): Promise<GoalActionResponse> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: `/api/goals/${encodeURIComponent(goalId)}/${verb}`,
    method: 'POST'
  })
}

export const completeGoal = (goalId: string) => goalAction(goalId, 'complete')
export const abandonGoal = (goalId: string) => goalAction(goalId, 'abandon')
export const pauseGoal = (goalId: string) => goalAction(goalId, 'pause')
export const resumeGoal = (goalId: string) => goalAction(goalId, 'resume')
export const confirmGoal = (goalId: string) => goalAction(goalId, 'confirm')
export const dismissGoal = (goalId: string) => goalAction(goalId, 'dismiss')
export const reopenGoal = (goalId: string) => goalAction(goalId, 'reopen')

export function dispatchGoal(goalId: string): Promise<{
  ok: boolean
  task_id: string
  created: boolean
  goal: GoalView
}> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: `/api/goals/${encodeURIComponent(goalId)}/dispatch`,
    method: 'POST'
  })
}
