import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import {
  getLead,
  getLeadIntake,
  getLeads,
  type LeadContactView,
  type LeadMessageView,
  patchLead,
  replyLead,
} from '@/api/leads'
import { useSubscriptionState } from '@/app/settings/billing/use-billing-state'
import { hasPremiumAccess } from '@/lib/entitlement'
import { requestBillingSettings } from '@/store/billing-block'

import { useLeads } from './i18n'

/**
 * LEADS pane: the human inbox, docked beside Bots/Feeds/Goals/PRDs. Contacts
 * derive from conversations that already happened (messaging channels + web
 * forms); selecting a row shows recent messages and a reply box. Replies
 * send as the connected bot account after an explicit confirm — nothing
 * here messages anyone on its own. Group chats and form-only leads are
 * read-only, stated inline.
 */

/** Whether the contact has a DM channel a reply can target. */
export function canReply(contact: Pick<LeadContactView, 'channels'>): boolean {
  return (contact.channels ?? []).some(channel => (channel.chat_type ?? 'dm') === 'dm')
}

export function LeadsPane() {
  const leads = useLeads()
  const subscription = useSubscriptionState()
  const premium = hasPremiumAccess(subscription.data?.ok ? subscription.data.data : null)
  const [query, setQuery] = useState('')
  const [channel, setChannel] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const leadsQuery = useQuery({
    queryKey: ['leads'],
    queryFn: () => getLeads(),
    enabled: premium,
  })

  if (!premium) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
        <p className="text-sm font-medium">{leads.pane.premiumTitle}</p>
        <p className="text-xs opacity-70">{leads.pane.premiumDesc}</p>
        <button
          className="mt-1 rounded border border-white/15 px-2 py-1 text-xs"
          onClick={() => requestBillingSettings()}
          type="button"
        >
          {leads.pane.viewPlans}
        </button>
      </div>
    )
  }

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] })
    queryClient.invalidateQueries({ queryKey: ['lead', selectedId] })
  }

  const all = leadsQuery.data?.contacts ?? []

  const platforms = useMemo(
    () => [...new Set(all.map(contact => contact.platform))].sort(),
    [all]
  )

  const q = query.trim().toLowerCase()

  const match = (contact: LeadContactView) =>
    (!channel || contact.platform === channel) &&
    (!q || contact.display_name.toLowerCase().includes(q) ||
      contact.snippet.toLowerCase().includes(q) ||
      (contact.emails ?? []).some(email => email.toLowerCase().includes(q)))

  const visible = useMemo(() => all.filter(c => !c.muted && match(c)), [all, q, channel])
  const muted = useMemo(() => all.filter(c => c.muted && match(c)), [all, q, channel])
  const error = leadsQuery.error

  if (selectedId) {
    return (
      <ContactDetail
        contactId={selectedId}
        onBack={() => setSelectedId(null)}
        onChanged={refresh}
      />
    )
  }

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden p-3">
      <div className="flex items-center gap-2">
        <input
          aria-label={leads.pane.searchPlaceholder}
          className="min-w-0 flex-1 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm"
          onChange={event => setQuery(event.target.value)}
          placeholder={leads.pane.searchPlaceholder}
          type="search"
          value={query}
        />
      </div>
      {platforms.length > 1 && (
        <div className="flex flex-wrap gap-1">
          <FilterChip active={channel === ''} onClick={() => setChannel('')}>
            {leads.pane.allChannels}
          </FilterChip>
          {platforms.map(platform => (
            <FilterChip active={channel === platform} key={platform} onClick={() => setChannel(platform)}>
              {platform}
            </FilterChip>
          ))}
        </div>
      )}

      {error && (
        <p className="text-[11px] text-rose-300" role="alert">
          {leads.pane.loadFailed(error instanceof Error ? error.message : String(error))}
        </p>
      )}

      <div className="flex flex-col gap-1.5 overflow-y-auto">
        {visible.map(contact => (
          <ContactRow contact={contact} key={contact.id} onOpen={() => setSelectedId(contact.id)} />
        ))}
        {muted.length > 0 && (
          <section className="flex flex-col gap-1.5 pt-1">
            <p className="text-xs font-medium opacity-70">{leads.pane.mutedTitle}</p>
            {muted.map(contact => (
              <ContactRow contact={contact} key={contact.id} onOpen={() => setSelectedId(contact.id)} />
            ))}
          </section>
        )}
        {visible.length === 0 && muted.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium">
              {query || channel ? leads.pane.noMatch(query || channel) : leads.pane.emptyTitle}
            </p>
            {!query && !channel && <p className="text-xs opacity-60">{leads.pane.emptyDesc}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

function FilterChip({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${
        active ? 'border-white/40 bg-white/10' : 'border-white/15 opacity-70'
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function ContactRow({ contact, onOpen }: { contact: LeadContactView; onOpen: () => void }) {
  return (
    <button
      className="flex flex-col gap-0.5 rounded border border-white/10 bg-white/[0.03] p-2 text-left"
      onClick={onOpen}
      type="button"
    >
      <span className="flex items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{contact.display_name}</span>
        {contact.unread > 0 && (
          <span aria-label={`${contact.unread} unread`} className="h-2 w-2 shrink-0 rounded-full bg-sky-400" />
        )}
        <span className="shrink-0 rounded border border-white/15 px-1.5 py-0.5 font-mono text-[10px] uppercase opacity-70">
          {contact.platform}
        </span>
      </span>
      {contact.snippet && (
        <span className="truncate text-[11px] opacity-60">{contact.snippet}</span>
      )}
    </button>
  )
}

function ContactDetail({
  contactId,
  onBack,
  onChanged,
}: {
  contactId: string
  onBack: () => void
  onChanged: () => void
}) {
  const leads = useLeads()

  const detailQuery = useQuery({
    queryKey: ['lead', contactId],
    queryFn: () => getLead(contactId),
  })

  const contact = detailQuery.data?.contact
  const messages = detailQuery.data?.messages ?? []

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden p-3">
      <div className="flex items-center gap-2">
        <button
          className="rounded border border-white/15 px-2 py-1 text-xs"
          onClick={onBack}
          type="button"
        >
          {leads.pane.backToList}
        </button>
        <p className="min-w-0 flex-1 truncate text-sm font-medium">
          {contact?.display_name ?? contactId.slice(0, 8)}
        </p>
      </div>

      {detailQuery.isError && (
        <p className="text-[11px] text-rose-300" role="alert">
          {leads.pane.loadFailed(
            detailQuery.error instanceof Error ? detailQuery.error.message : String(detailQuery.error)
          )}
        </p>
      )}

      <div className="flex flex-col gap-2 overflow-y-auto">
        {messages.map((message, i) => (
          <MessageBubble key={i} message={message} />
        ))}
        {contact && <ContactInfo contact={contact} onChanged={onChanged} onGone={onBack} />}
        {contact && <IntakeViewer contact={contact} />}
      </div>

      {contact && <ReplyBox contact={contact} onChanged={onChanged} />}
    </div>
  )
}

function MessageBubble({ message }: { message: LeadMessageView }) {
  const mine = message.role !== 'user'

  return (
    <div className={`flex flex-col gap-0.5 rounded border border-white/10 bg-white/[0.03] p-2 ${mine ? 'ml-4' : 'mr-4'}`}>
      <p className="break-words text-xs">{message.text}</p>
      <p className="font-mono text-[10px] opacity-50">
        {message.role}
        {message.timestamp > 0 ? ` · ${new Date(message.timestamp * 1000).toLocaleString()}` : ''}
      </p>
    </div>
  )
}

function ContactInfo({ contact, onChanged, onGone }: { contact: LeadContactView; onChanged: () => void; onGone: () => void }) {
  const leads = useLeads()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [editingNote, setEditingNote] = useState(false)
  const [merging, setMerging] = useState(false)
  const [note, setNote] = useState(contact.note)

  const act = (fn: () => Promise<unknown>, gone = false) => {
    setBusy(true)
    setError(null)
    void fn()
      .then(() => {
        if (gone) {onGone()}
        else {onChanged()}
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => {
        setBusy(false)
        setEditingNote(false)
        setMerging(false)
      })
  }

  return (
    <div className="flex flex-col gap-1.5 rounded border border-white/10 bg-white/[0.03] p-2.5 text-[11px]">
      <p className="opacity-70">
        {leads.pane.channelsLabel}: {contact.channels.map(c => c.platform).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
      </p>
      {(contact.emails ?? []).map(email => (
        <p className="break-all opacity-70" key={email}>{leads.pane.emailsLabel}: {email}</p>
      ))}
      {(contact.phones ?? []).map(phone => (
        <p className="opacity-70" key={phone}>{leads.pane.phonesLabel}: {phone}</p>
      ))}
      {contact.note && !editingNote && (
        <p className="opacity-70">{leads.pane.noteLabel}: {contact.note}</p>
      )}
      {(contact.also_on ?? []).length > 0 && (
        <p className="opacity-70">
          {leads.pane.alsoOnLabel}: {(contact.also_on ?? []).map(hint => `${hint.display_name} (${hint.via})`).join(', ')}
        </p>
      )}
      {(contact.merged_from ?? []).length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="opacity-70">{leads.pane.mergedFromLabel}:</p>
          {(contact.merged_from ?? []).map(ref => (
            <div className="flex items-center gap-1" key={ref.contact_id}>
              <span className="min-w-0 flex-1 truncate">{ref.display_name}</span>
              <ActionButton disabled={busy} onClick={() => act(() => patchLead(ref.contact_id, { merged_into: '' }))}>
                {leads.pane.unmerge}
              </ActionButton>
            </div>
          ))}
        </div>
      )}
      {editingNote ? (
        <div className="flex flex-col gap-1">
          <textarea
            className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px]"
            onChange={event => setNote(event.target.value)}
            placeholder={leads.pane.notePlaceholder}
            rows={2}
            value={note}
          />
          <div className="flex gap-1">
            <ActionButton disabled={busy} onClick={() => act(() => patchLead(contact.id, { note: note.trim() }))}>
              {leads.pane.saveNote}
            </ActionButton>
            <ActionButton disabled={busy} onClick={() => setEditingNote(false)}>
              {leads.pane.cancel}
            </ActionButton>
          </div>
        </div>
      ) : merging ? (
        <MergePicker
          disabled={busy}
          excludeId={contact.id}
          onCancel={() => setMerging(false)}
          onPick={targetId => act(() => patchLead(contact.id, { merged_into: targetId }), true)}
        />
      ) : (
        <div className="flex flex-wrap gap-1">
          <ActionButton disabled={busy} onClick={() => act(() => patchLead(contact.id, { muted: !contact.muted }))}>
            {contact.muted ? leads.pane.unmute : leads.pane.mute}
          </ActionButton>
          <ActionButton disabled={busy} onClick={() => act(() => patchLead(contact.id, { pinned: !contact.pinned }))}>
            {contact.pinned ? leads.pane.unpin : leads.pane.pin}
          </ActionButton>
          <ActionButton disabled={busy} onClick={() => { setNote(contact.note); setEditingNote(true) }}>
            {leads.pane.editNote}
          </ActionButton>
          <ActionButton disabled={busy} onClick={() => setMerging(true)}>
            {leads.pane.merge}
          </ActionButton>
        </div>
      )}
      {error && (
        <p className="text-rose-300" role="alert">
          {leads.pane.actionFailed(error)}
        </p>
      )}
    </div>
  )
}

function MergePicker({
  excludeId,
  onPick,
  onCancel,
  disabled,
}: {
  excludeId: string
  onPick: (targetId: string) => void
  onCancel: () => void
  disabled?: boolean
}) {
  const leads = useLeads()
  const [filter, setFilter] = useState('')

  const candidatesQuery = useQuery({
    queryKey: ['leads'],
    queryFn: () => getLeads(),
  })

  const q = filter.trim().toLowerCase()

  const candidates = (candidatesQuery.data?.contacts ?? []).filter(
    contact => contact.id !== excludeId &&
      (!q || contact.display_name.toLowerCase().includes(q))
  )

  return (
    <div className="flex flex-col gap-1 rounded border border-white/10 bg-white/[0.03] p-2">
      <p className="text-[11px] font-medium">{leads.pane.mergeTitle}</p>
      <input
        aria-label={leads.pane.searchPlaceholder}
        className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px]"
        onChange={event => setFilter(event.target.value)}
        placeholder={leads.pane.searchPlaceholder}
        value={filter}
      />
      <div className="flex max-h-32 flex-col gap-1 overflow-y-auto">
        {candidates.map(contact => (
          <div className="flex items-center gap-1" key={contact.id}>
            <span className="min-w-0 flex-1 truncate text-[11px]">{contact.display_name}</span>
            <ActionButton disabled={disabled} onClick={() => onPick(contact.id)}>
              {leads.pane.mergeHere}
            </ActionButton>
          </div>
        ))}
      </div>
      <div>
        <ActionButton disabled={disabled} onClick={onCancel}>
          {leads.pane.cancel}
        </ActionButton>
      </div>
    </div>
  )
}

function IntakeViewer({ contact }: { contact: LeadContactView }) {
  const leads = useLeads()
  const hasForm = (contact.channels ?? []).some(channel => channel.chat_type === 'form')

  const intakeQuery = useQuery({
    queryKey: ['lead-intake', contact.id],
    queryFn: () => getLeadIntake(contact.id),
    enabled: hasForm,
  })

  if (!hasForm) {return null}
  const events = intakeQuery.data?.events ?? []

  if (events.length === 0) {return null}

  return (
    <div className="flex flex-col gap-1.5 rounded border border-white/10 bg-white/[0.03] p-2.5">
      <p className="text-xs font-medium">{leads.pane.intakeTitle}</p>
      {events.map(event => (
        <p className="break-words text-[11px] opacity-80" key={event.id ?? event.text.slice(0, 24)}>
          {event.text}
        </p>
      ))}
    </div>
  )
}

function ReplyBox({ contact, onChanged }: { contact: LeadContactView; onChanged: () => void }) {  const leads = useLeads()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [sent, setSent] = useState(false)

  if (!canReply(contact)) {
    const formOnly = contact.platform === 'form'

    return (
      <p className="rounded border border-white/10 bg-white/[0.03] p-2 text-[11px] opacity-70">
        {formOnly ? leads.pane.formNoChat : leads.pane.groupReadOnly}
      </p>
    )
  }

  const send = () => {
    setBusy(true)
    setError(null)
    void replyLead(contact.id, text.trim())
      .then(() => {
        setText('')
        setSent(true)
        onChanged()
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => {
        setBusy(false)
        setConfirming(false)
      })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] opacity-60">{leads.pane.sendingAs(contact.platform)}</p>
      {confirming ? (
        <div className="flex flex-col gap-1 rounded border border-white/10 bg-white/[0.03] p-2">
          <p className="text-[11px]">{leads.pane.confirmSend(contact.display_name)}</p>
          <p className="break-words text-[11px] opacity-70">{text.trim()}</p>
          <div className="flex gap-1">
            <ActionButton disabled={busy} onClick={send}>
              {busy ? leads.pane.sending : leads.pane.send}
            </ActionButton>
            <ActionButton disabled={busy} onClick={() => setConfirming(false)}>
              {leads.pane.cancel}
            </ActionButton>
          </div>
        </div>
      ) : (
        <>
          <label className="flex flex-col gap-1 text-xs">
            {leads.pane.replyLabel}
            <textarea
              className="rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs"
              onChange={event => { setText(event.target.value); setSent(false) }}
              placeholder={leads.pane.replyPlaceholder}
              rows={2}
              value={text}
            />
          </label>
          <div>
            <ActionButton disabled={busy || !text.trim()} onClick={() => setConfirming(true)}>
              {leads.pane.send}
            </ActionButton>
          </div>
        </>
      )}
      {sent && !confirming && <p className="text-[11px] text-emerald-300">{leads.pane.replySent}</p>}
      {error && (
        <p className="text-[11px] text-rose-300" role="alert">
          {leads.pane.actionFailed(error)}
        </p>
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
      className="rounded border border-white/15 px-1.5 py-0.5 text-[11px] disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}
