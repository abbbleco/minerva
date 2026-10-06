import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { hasPremiumAccess } from '@/lib/entitlement'
import { useSubscriptionState } from '@/app/settings/billing/use-billing-state'
import { requestBillingSettings } from '@/store/billing-block'
import {
  dispatchPrd,
  getPrdCases,
  getPrds,
  injectPrdIntake,
  reviewPrd,
  type PrdCaseView,
  type PrdView,
} from '@/api/prds'

import { usePrds, type PrdsMessages } from './i18n'

/**
 * PRDs pane: the review queue for the intake pipeline, docked beside
 * Bots/Feeds/Goals. Drafts and in-review documents await human
 * approve/edit/reject; watch cases accumulate context visibly; approved PRDs
 * dispatch explicitly to kanban. Nothing reaches kanban without review.
 */

const STATUS_LABEL_KEY: Record<string, keyof PrdsMessages['pane']> = {
  draft: 'statusDraft',
  in_review: 'statusInReview',
  approved: 'statusApproved',
  rejected: 'statusRejected',
  watch: 'statusWatch',
  dismissed: 'statusDismissed',
}

const STATUS_TONE: Record<string, string> = {
  draft: 'text-sky-300 border-sky-400/30',
  in_review: 'text-violet-300 border-violet-400/30',
  approved: 'text-emerald-300 border-emerald-400/30',
  rejected: 'text-rose-300 border-rose-400/30',
  watch: 'text-amber-300 border-amber-400/30',
  dismissed: 'text-white/50 border-white/15',
}

const REVISABLE_FIELDS = [
  'title',
  'problem',
  'users',
  'requirements',
  'acceptance_criteria',
  'open_questions',
] as const

const LIST_FIELDS: ReadonlySet<string> = new Set([
  'requirements',
  'acceptance_criteria',
  'open_questions',
])

export function statusLabel(pane: PrdsMessages['pane'], status: string): string {
  const key = STATUS_LABEL_KEY[status]
  const label = key ? pane[key] : undefined
  return typeof label === 'string' ? label : status
}

export function PrdsPane() {
  const prds = usePrds()
  const subscription = useSubscriptionState()
  const premium = hasPremiumAccess(subscription.data?.ok ? subscription.data.data : null)
  const [query, setQuery] = useState('')
  const [injecting, setInjecting] = useState(false)
  const queryClient = useQueryClient()

  const prdsQuery = useQuery({
    queryKey: ['prds'],
    queryFn: () => getPrds(),
    enabled: premium,
  })
  const casesQuery = useQuery({
    queryKey: ['prds-cases'],
    queryFn: () => getPrdCases(),
    enabled: premium,
  })

  if (!premium) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
        <p className="text-sm font-medium">{prds.pane.premiumTitle}</p>
        <p className="text-xs opacity-70">{prds.pane.premiumDesc}</p>
        <button
          type="button"
          onClick={() => requestBillingSettings()}
          className="mt-1 rounded border border-white/15 px-2 py-1 text-xs"
        >
          {prds.pane.viewPlans}
        </button>
      </div>
    )
  }

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['prds'] })
    queryClient.invalidateQueries({ queryKey: ['prds-cases'] })
  }
  const all = prdsQuery.data?.prds ?? []
  const cases = casesQuery.data?.cases ?? []
  const q = query.trim().toLowerCase()
  const matchDoc = (doc: PrdView) =>
    !q || doc.title.toLowerCase().includes(q) ||
    doc.problem.toLowerCase().includes(q)
  const matchCase = (c: PrdCaseView) =>
    !q || c.reason.toLowerCase().includes(q) ||
    c.conversation_id.toLowerCase().includes(q)
  const review = useMemo(
    () => all.filter(d => (d.status === 'draft' || d.status === 'in_review') && matchDoc(d)),
    [all, q]
  )
  const watching = useMemo(() => cases.filter(c => c.status === 'watch' && matchCase(c)), [cases, q])
  const history = useMemo(
    () => [
      ...all.filter(d => (d.status === 'approved' || d.status === 'rejected') && matchDoc(d)),
      ...cases.filter(c => c.status === 'dismissed' && matchCase(c)),
    ],
    [all, cases, q]
  )
  const error = prdsQuery.error ?? casesQuery.error

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden p-3">
      <div className="flex items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={prds.pane.searchPlaceholder}
          aria-label={prds.pane.searchPlaceholder}
          className="min-w-0 flex-1 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={() => setInjecting(value => !value)}
          className="rounded border border-white/15 px-2 py-1.5 text-xs"
        >
          {prds.pane.newIntake}
        </button>
      </div>

      {injecting && (
        <NewIntakeForm
          onDone={() => {
            setInjecting(false)
            void refresh()
          }}
          onCancel={() => setInjecting(false)}
        />
      )}

      {error && (
        <p className="text-[11px] text-rose-300" role="alert">
          {prds.pane.loadFailed(error instanceof Error ? error.message : String(error))}
        </p>
      )}

      <div className="flex flex-col gap-2 overflow-y-auto">
        {review.length > 0 && (
          <section className="flex flex-col gap-1.5 rounded border border-violet-400/20 bg-violet-400/[0.06] p-2.5">
            <p className="text-xs font-medium">{prds.pane.reviewTitle}</p>
            <p className="text-[11px] opacity-70">{prds.pane.reviewDesc}</p>
            {review.map(doc => (
              <PrdRow key={doc.id} doc={doc} onChanged={refresh} />
            ))}
          </section>
        )}

        {watching.length > 0 && (
          <section className="flex flex-col gap-1.5 p-2.5">
            <p className="text-xs font-medium">{prds.pane.watchingTitle}</p>
            <p className="text-[11px] opacity-70">{prds.pane.watchingDesc}</p>
            {watching.map(c => (
              <WatchRow key={c.id} watch={c} />
            ))}
          </section>
        )}

        {history.length > 0 && (
          <section className="flex flex-col gap-1.5 p-2.5">
            <p className="text-xs font-medium">{prds.pane.historyTitle}</p>
            {history.map(item =>
              'event_ids' in item ? (
                <WatchRow key={item.id} watch={item as PrdCaseView} />
              ) : (
                <PrdRow key={item.id} doc={item as PrdView} onChanged={refresh} />
              )
            )}
          </section>
        )}

        {review.length === 0 && watching.length === 0 && history.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium">
              {query ? prds.pane.noMatch(query) : prds.pane.emptyTitle}
            </p>
            {!query && <p className="text-xs opacity-60">{prds.pane.emptyDesc}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

function WatchRow({ watch }: { watch: PrdCaseView }) {
  const prds = usePrds()
  return (
    <div className="flex flex-col gap-1 rounded border border-white/10 bg-white/[0.03] p-2.5">
      <div className="flex items-start gap-1.5">
        <p className="min-w-0 flex-1 break-words text-xs opacity-80">{watch.reason}</p>
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${
            STATUS_TONE[watch.status] ?? 'border-white/15 text-white/60'
          }`}
        >
          {statusLabel(prds.pane, watch.status)}
        </span>
      </div>
      <p className="font-mono text-[10px] opacity-60">
        {prds.pane.conversationLabel}: {watch.conversation_id} · {watch.event_ids.length} events
      </p>
    </div>
  )
}

function PrdRow({ doc, onChanged }: { doc: PrdView; onChanged: () => void }) {
  const prds = usePrds()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState<'reject' | 'revise' | null>(null)
  const [reason, setReason] = useState('')
  const [field, setField] = useState<string>('problem')
  const [value, setValue] = useState('')

  const act = (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    void fn()
      .then(onChanged)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => {
        setBusy(false)
        setConfirming(null)
      })
  }

  const reviseValue = () =>
    LIST_FIELDS.has(field) ? value.split('\n').map(line => line.trim()).filter(Boolean) : value

  return (
    <div className="flex flex-col gap-1.5 rounded border border-white/10 bg-white/[0.03] p-2.5">
      <div className="flex items-start gap-1.5">
        <p className="min-w-0 flex-1 break-words text-sm font-medium">{doc.title}</p>
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${
            STATUS_TONE[doc.status] ?? 'border-white/15 text-white/60'
          }`}
        >
          {statusLabel(prds.pane, doc.status)}
        </span>
      </div>
      <p className="text-[11px] opacity-80">{doc.problem}</p>
      {doc.requirements.length > 0 && (
        <ul className="list-disc pl-4 text-[11px] opacity-70">
          {doc.requirements.slice(0, 5).map((req, i) => (
            <li key={i} className="break-words">{req}</li>
          ))}
        </ul>
      )}
      <p className="font-mono text-[10px] opacity-60">
        {prds.pane.sourcesLabel}: {doc.sources.length}
        {doc.conversation_id ? ` · ${prds.pane.conversationLabel}: ${doc.conversation_id.slice(0, 12)}` : ''}
      </p>
      {doc.kanban_task_id && (
        <p className="font-mono text-[10px] opacity-60">{prds.pane.dispatched(doc.kanban_task_id)}</p>
      )}
      {error && (
        <p className="text-[11px] text-rose-300" role="alert">
          {prds.pane.actionFailed(error)}
        </p>
      )}
      {confirming === 'reject' && (
        <div className="flex flex-col gap-1">
          <label className="flex flex-col gap-1 text-[11px]">
            {prds.pane.rejectReasonLabel}
            <input
              value={reason}
              onChange={event => setReason(event.target.value)}
              placeholder={prds.pane.rejectReasonPlaceholder}
              className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px]"
            />
          </label>
          <div className="flex gap-1">
            <ActionButton disabled={busy || !reason.trim()} onClick={() => act(() => reviewPrd(doc.id, { action: 'reject', reason: reason.trim() }))}>
              {prds.pane.reject}
            </ActionButton>
            <ActionButton disabled={busy} onClick={() => setConfirming(null)}>
              {prds.pane.cancel}
            </ActionButton>
          </div>
        </div>
      )}
      {confirming === 'revise' && (
        <div className="flex flex-col gap-1">
          <label className="flex flex-col gap-1 text-[11px]">
            {prds.pane.reviseFieldLabel}
            <select
              value={field}
              onChange={event => setField(event.target.value)}
              className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px]"
            >
              {REVISABLE_FIELDS.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px]">
            {prds.pane.reviseValueLabel}
            <textarea
              value={value}
              onChange={event => setValue(event.target.value)}
              rows={3}
              className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px]"
            />
          </label>
          <div className="flex gap-1">
            <ActionButton disabled={busy || !value.trim()} onClick={() => act(() => reviewPrd(doc.id, { action: 'revise', field, value: reviseValue() }))}>
              {prds.pane.save}
            </ActionButton>
            <ActionButton disabled={busy} onClick={() => setConfirming(null)}>
              {prds.pane.cancel}
            </ActionButton>
          </div>
        </div>
      )}
      {confirming === null && (
        <div className="flex flex-wrap gap-1">
          {doc.status === 'draft' && (
            <ActionButton disabled={busy} onClick={() => act(() => reviewPrd(doc.id, { action: 'start' }))}>
              {prds.pane.startReview}
            </ActionButton>
          )}
          {(doc.status === 'draft' || doc.status === 'in_review') && (
            <>
              <ActionButton disabled={busy} onClick={() => act(() => reviewPrd(doc.id, { action: 'approve' }))}>
                {prds.pane.approve}
              </ActionButton>
              <ActionButton disabled={busy} onClick={() => setConfirming('reject')}>
                {prds.pane.reject}
              </ActionButton>
              <ActionButton disabled={busy} onClick={() => setConfirming('revise')}>
                {prds.pane.revise}
              </ActionButton>
            </>
          )}
          {doc.status === 'approved' && !doc.kanban_task_id && (
            <ActionButton disabled={busy} onClick={() => act(() => dispatchPrd(doc.id))}>
              {prds.pane.dispatch}
            </ActionButton>
          )}
        </div>
      )}
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

function NewIntakeForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const prds = usePrds()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const save = () => {
    setSaving(true)
    setError(null)
    void injectPrdIntake({ text: text.trim() })
      .then(onDone)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setSaving(false))
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-white/10 bg-white/[0.03] p-2.5">
      <label className="flex flex-col gap-1 text-xs">
        {prds.pane.intakeLabel}
        <textarea
          value={text}
          onChange={event => setText(event.target.value)}
          placeholder={prds.pane.intakePlaceholder}
          rows={4}
          className="rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs"
        />
      </label>
      {error && (
        <p className="text-[11px] text-rose-300" role="alert">
          {prds.pane.actionFailed(error)}
        </p>
      )}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={save}
          disabled={saving || !text.trim()}
          className="rounded border border-white/15 px-2 py-1 text-xs disabled:opacity-50"
        >
          {saving ? prds.pane.injecting : prds.pane.inject}
        </button>
        <button type="button" onClick={onCancel} className="rounded border border-white/15 px-2 py-1 text-xs">
          {prds.pane.cancel}
        </button>
      </div>
    </div>
  )
}
