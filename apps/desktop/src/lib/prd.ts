/**
 * TypeScript mirror of `hermes_cli/prd.py`. The Python dataclass is the source
 * of truth (statuses, legal transitions, required fields); this file must
 * accept everything it emits and reject everything it would reject. The
 * review-queue viewer (Phase 4) renders these shapes; transitions themselves
 * happen backend-side so every move is recorded in `history`.
 */

export type PrdStatus = 'draft' | 'in_review' | 'approved' | 'rejected'

export interface PrdTransition {
  at: number
  from_status: string
  to_status: string
  actor: string
  reason: string
}

export interface PrdDocument {
  id: string
  title: string
  problem: string
  users: string
  requirements: string[]
  acceptance_criteria: string[]
  open_questions: string[]
  sources: string[]
  status: PrdStatus
  history: PrdTransition[]
}

const PRD_STATUSES: ReadonlySet<string> = new Set(['draft', 'in_review', 'approved', 'rejected'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

export function isPrdTransition(value: unknown): value is PrdTransition {
  if (!isRecord(value)) {return false}

  return (
    typeof value.at === 'number' &&
    typeof value.from_status === 'string' &&
    typeof value.to_status === 'string' &&
    typeof value.actor === 'string' &&
    typeof value.reason === 'string'
  )
}

export function isPrdDocument(value: unknown): value is PrdDocument {
  if (!isRecord(value)) {return false}

  return (
    typeof value.id === 'string' &&
    value.id !== '' &&
    typeof value.title === 'string' &&
    value.title.trim() !== '' &&
    typeof value.problem === 'string' &&
    value.problem.trim() !== '' &&
    typeof value.users === 'string' &&
    isStringArray(value.requirements) &&
    isStringArray(value.acceptance_criteria) &&
    isStringArray(value.open_questions) &&
    Array.isArray(value.sources) &&
    value.sources.length > 0 &&
    value.sources.every(item => typeof item === 'string') &&
    typeof value.status === 'string' &&
    PRD_STATUSES.has(value.status) &&
    Array.isArray(value.history) &&
    value.history.every(isPrdTransition)
  )
}
