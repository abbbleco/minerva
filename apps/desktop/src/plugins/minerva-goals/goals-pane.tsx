import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { hasPremiumAccess } from '@/lib/entitlement'
import { useSubscriptionState } from '@/app/settings/billing/use-billing-state'
import { requestBillingSettings } from '@/store/billing-block'
import {
  abandonGoal,
  completeGoal,
  confirmGoal,
  createGoal,
  dismissGoal,
  dispatchGoal,
  getGoals,
  pauseGoal,
  reopenGoal,
  resumeGoal,
  type GoalView,
} from '@/api/goals'

import { useGoals, type GoalsMessages } from './i18n'

/**
 * Goals pane: the tracked-goal registry docked beside Bots/Feeds. Shows plural
 * named goals per profile with status and audit history, a confirmation inbox
 * for judge-proposed completions, and an explicit "dispatch to kanban" bridge.
 * Goals track outcomes; kanban tracks work — the link is always user-issued.
 */

const STATUS_LABEL_KEY: Record<string, keyof GoalsMessages['pane']> = {
  active: 'statusActive',
  paused: 'statusPaused',
  'pending-confirmation': 'statusPending',
  complete: 'statusComplete',
  abandoned: 'statusAbandoned',
}

const STATUS_TONE: Record<string, string> = {
  active: 'text-sky-300 border-sky-400/30',
  paused: 'text-amber-300 border-amber-400/30',
  'pending-confirmation': 'text-violet-300 border-violet-400/30',
  complete: 'text-emerald-300 border-emerald-400/30',
  abandoned: 'text-white/50 border-white/15',
}

export function statusLabel(pane: GoalsMessages['pane'], status: string): string {
  const key = STATUS_LABEL_KEY[status]
  const label = key ? pane[key] : undefined
  return typeof label === 'string' ? label : status
}

export function GoalsPane() {
  const goals = useGoals()
  const subscription = useSubscriptionState()
  const premium = hasPremiumAccess(subscription.data?.ok ? subscription.data.data : null)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const queryClient = useQueryClient()

  const goalsQuery = useQuery({
    queryKey: ['goals'],
    queryFn: () => getGoals(),
    enabled: premium,
  })

  if (!premium) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
        <p className="text-sm font-medium">{goals.pane.premiumTitle}</p>
        <p className="text-xs opacity-70">{goals.pane.premiumDesc}</p>
        <button
          type="button"
          onClick={() => requestBillingSettings()}
          className="mt-1 rounded border border-white/15 px-2 py-1 text-xs"
        >
          {goals.pane.viewPlans}
        </button>
      </div>
    )
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['goals'] })
  const all = goalsQuery.data?.goals ?? []
  const q = query.trim().toLowerCase()
  const match = (goal: GoalView) =>
    !q || goal.title.toLowerCase().includes(q) ||
    String(goal.contract?.verification ?? '').toLowerCase().includes(q)
  const pending = useMemo(() => all.filter(g => g.status === 'pending-confirmation' && match(g)), [all, q])
  const visible = useMemo(
    () => all.filter(g => g.status !== 'pending-confirmation' && match(g)),
    [all, q]
  )

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden p-3">
      <div className="flex items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={goals.pane.searchPlaceholder}
          aria-label={goals.pane.searchPlaceholder}
          className="min-w-0 flex-1 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={() => setCreating(value => !value)}
          className="rounded border border-white/15 px-2 py-1.5 text-xs"
        >
          {goals.pane.newGoal}
        </button>
      </div>

      {creating && (
        <NewGoalForm
          onDone={() => {
            setCreating(false)
            void refresh()
          }}
          onCancel={() => setCreating(false)}
        />
      )}

      {goalsQuery.isError && (
        <p className="text-[11px] text-rose-300" role="alert">
          {goals.pane.loadFailed(
            goalsQuery.error instanceof Error ? goalsQuery.error.message : String(goalsQuery.error)
          )}
        </p>
      )}

      <div className="flex flex-col gap-2 overflow-y-auto">
        {pending.length > 0 && (
          <section className="flex flex-col gap-1.5 rounded border border-violet-400/20 bg-violet-400/[0.06] p-2.5">
            <p className="text-xs font-medium">{goals.pane.inboxTitle}</p>
            <p className="text-[11px] opacity-70">{goals.pane.inboxDesc}</p>
            {pending.map(goal => (
              <GoalRow key={goal.id} goal={goal} onChanged={refresh} />
            ))}
          </section>
        )}

        {visible.length === 0 && pending.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium">
              {query ? goals.pane.noMatch(query) : goals.pane.emptyTitle}
            </p>
            {!query && <p className="text-xs opacity-60">{goals.pane.emptyDesc}</p>}
          </div>
        ) : (
          visible.map(goal => <GoalRow key={goal.id} goal={goal} onChanged={refresh} />)
        )}
      </div>
    </div>
  )
}

function GoalRow({ goal, onChanged }: { goal: GoalView; onChanged: () => void }) {
  const goals = useGoals()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const verification = goal.contract?.verification
  const evidence = latestEvidence(goal)

  const act = (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    void fn()
      .then(onChanged)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setBusy(false))
  }

  return (
    <div className="flex flex-col gap-1.5 rounded border border-white/10 bg-white/[0.03] p-2.5">
      <div className="flex items-start gap-1.5">
        <p className="min-w-0 flex-1 break-words text-sm font-medium">{goal.title}</p>
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${
            STATUS_TONE[goal.status] ?? 'border-white/15 text-white/60'
          }`}
        >
          {statusLabel(goals.pane, goal.status)}
        </span>
      </div>
      {verification && <p className="text-[11px] opacity-70">{verification}</p>}
      {evidence && (
        <p className="text-[11px] opacity-70">
          <span className="opacity-70">{goals.pane.evidenceLabel}:</span> “{evidence}”
        </p>
      )}
      {goal.kanban_task_id && (
        <p className="font-mono text-[10px] opacity-60">
          {goals.pane.dispatched(goal.kanban_task_id)}
        </p>
      )}
      {error && (
        <p className="text-[11px] text-rose-300" role="alert">
          {goals.pane.actionFailed(error)}
        </p>
      )}
      <div className="flex flex-wrap gap-1">
        {goal.status === 'pending-confirmation' && (
          <>
            <ActionButton disabled={busy} onClick={() => act(() => confirmGoal(goal.id))}>
              {goals.pane.confirm}
            </ActionButton>
            <ActionButton disabled={busy} onClick={() => act(() => dismissGoal(goal.id))}>
              {goals.pane.dismiss}
            </ActionButton>
          </>
        )}
        {goal.status === 'active' && (
          <>
            <ActionButton disabled={busy} onClick={() => act(() => pauseGoal(goal.id))}>
              {goals.pane.pause}
            </ActionButton>
            <ActionButton disabled={busy} onClick={() => act(() => completeGoal(goal.id))}>
              {goals.pane.complete}
            </ActionButton>
            <ActionButton disabled={busy} onClick={() => act(() => abandonGoal(goal.id))}>
              {goals.pane.abandon}
            </ActionButton>
          </>
        )}
        {goal.status === 'paused' && (
          <>
            <ActionButton disabled={busy} onClick={() => act(() => resumeGoal(goal.id))}>
              {goals.pane.resume}
            </ActionButton>
            <ActionButton disabled={busy} onClick={() => act(() => abandonGoal(goal.id))}>
              {goals.pane.abandon}
            </ActionButton>
          </>
        )}
        {(goal.status === 'complete' || goal.status === 'abandoned') && (
          <ActionButton disabled={busy} onClick={() => act(() => reopenGoal(goal.id))}>
            {goals.pane.reopen}
          </ActionButton>
        )}
        {!goal.kanban_task_id && (goal.status === 'active' || goal.status === 'complete') && (
          <ActionButton disabled={busy} onClick={() => act(() => dispatchGoal(goal.id))}>
            {goals.pane.dispatch}
          </ActionButton>
        )}
      </div>
    </div>
  )
}

function ActionButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded border border-white/15 px-1.5 py-0.5 text-[11px] disabled:opacity-50"
    >
      {children}
    </button>
  )
}

function NewGoalForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const goals = useGoals()
  const [title, setTitle] = useState('')
  const [objective, setObjective] = useState('')
  const [verification, setVerification] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const save = () => {
    setSaving(true)
    setError(null)
    const contract: Record<string, string> = {}
    if (objective.trim()) contract.objective = objective.trim()
    if (verification.trim()) contract.verification = verification.trim()
    void createGoal({ title: title.trim(), contract })
      .then(onDone)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setSaving(false))
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-white/10 bg-white/[0.03] p-2.5">
      <label className="flex flex-col gap-1 text-xs">
        {goals.pane.titleLabel}
        <input
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder={goals.pane.titlePlaceholder}
          className="rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        {goals.pane.objectiveLabel}
        <input
          value={objective}
          onChange={event => setObjective(event.target.value)}
          placeholder={goals.pane.objectivePlaceholder}
          className="rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        {goals.pane.verificationLabel}
        <input
          value={verification}
          onChange={event => setVerification(event.target.value)}
          placeholder={goals.pane.verificationPlaceholder}
          className="rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs"
        />
      </label>
      {error && (
        <p className="text-[11px] text-rose-300" role="alert">
          {goals.pane.actionFailed(error)}
        </p>
      )}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={save}
          disabled={saving || !title.trim()}
          className="rounded border border-white/15 px-2 py-1 text-xs disabled:opacity-50"
        >
          {saving ? goals.pane.creating : goals.pane.create}
        </button>
        <button type="button" onClick={onCancel} className="rounded border border-white/15 px-2 py-1 text-xs">
          {goals.pane.cancel}
        </button>
      </div>
    </div>
  )
}

/** Newest evidence string in a goal's audit history, if any. */
function latestEvidence(goal: GoalView): string {
  const history = goal.history ?? []
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const evidence = history[i]?.evidence
    if (evidence) return evidence
  }
  return ''
}
