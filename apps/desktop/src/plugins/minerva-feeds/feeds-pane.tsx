import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { hasPremiumAccess } from '@/lib/entitlement'
import { useSubscriptionState } from '@/app/settings/billing/use-billing-state'
import { $activeGatewayProfile, newSessionInProfile } from '@/store/profile'
import { setComposerDraft } from '@/store/composer'
import { requestBillingSettings } from '@/store/billing-block'
import { deleteEnvVar, setEnvVar } from '@/api/config'
import {
  addFeedSource,
  getFeedItems,
  getFeedProviderStatus,
  getFeedSources,
  markFeedItemRead,
  pollFeeds,
  removeFeedSource,
  setFeedSourceEnabled,
  validateFeedProvider,
  type FeedItemView,
  type FeedSourceView,
} from '@/api/feeds'

import { useFeeds, type FeedsMessages } from './i18n'

/**
 * Feeds pane: curated sources with ingest-time briefs, docked beside Bots.
 * Reads cached items (never summarizes at render); polling and briefs happen
 * backend-side on refresh. Background work never steals focus or navigates —
 * refresh is user-initiated or mount-triggered, and failures render inline.
 */

function providerTokenEnv(provider: string): string {
  // Mirrors hermes_cli/feeds.py::provider_token_env. The backend auto-fills
  // the same name on add as a backstop; computing it here lets the connect
  // dialog save the token under the exact key the poller will read.
  return `FEEDS_${provider.toUpperCase()}_TOKEN`
}

// Provider id → i18n key. New providers add one row here and one catalog
// entry each — no branching at the call sites.
const PROVIDER_LABEL_KEY: Record<string, keyof FeedsMessages['pane']> = {
  rss: 'providerRss',
  facebook: 'providerFacebook',
  instagram: 'providerInstagram',
}

const TOKEN_HELP_KEY: Record<string, keyof FeedsMessages['pane']> = {
  facebook: 'tokenHelpFacebook',
  instagram: 'tokenHelpInstagram',
}

export function providerLabel(pane: FeedsMessages['pane'], id: string): string {
  const key = PROVIDER_LABEL_KEY[id]
  const label = key ? pane[key] : undefined
  return typeof label === 'string' ? label : id
}

export function tokenHelp(pane: FeedsMessages['pane'], provider: string): string {
  const key = TOKEN_HELP_KEY[provider] ?? 'tokenPlaceholder'
  const help = pane[key]
  return typeof help === 'string' ? help : pane.tokenPlaceholder
}

export function FeedsPane() {
  const feeds = useFeeds()
  const subscription = useSubscriptionState()
  const premium = hasPremiumAccess(subscription.data?.ok ? subscription.data.data : null)
  const [query, setQuery] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [managing, setManaging] = useState(false)

  const queryClient = useQueryClient()
  const itemsQuery = useQuery({
    queryKey: ['feeds', 'items', { unreadOnly }],
    queryFn: () => getFeedItems({ unread_only: unreadOnly, limit: 200 }),
    enabled: premium,
  })
  const sourcesQuery = useQuery({
    queryKey: ['feeds', 'sources'],
    queryFn: () => getFeedSources(),
    enabled: premium,
  })

  const refresh = async () => {
    await pollFeeds()
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['feeds', 'items'] }),
      queryClient.invalidateQueries({ queryKey: ['feeds', 'sources'] }),
    ])
  }

  if (!premium) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
        <p className="text-sm font-medium">{feeds.pane.premiumTitle}</p>
        <p className="text-xs opacity-70">{feeds.pane.premiumDesc}</p>
        <button
          type="button"
          onClick={() => requestBillingSettings()}
          className="mt-1 rounded border border-white/15 px-2 py-1 text-xs"
        >
          {feeds.pane.viewPlans}
        </button>
      </div>
    )
  }

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    const all = itemsQuery.data?.items ?? []
    if (!q) return all
    return all.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.brief.toLowerCase().includes(q)
    )
  }, [query, itemsQuery.data])

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden p-3">
      <div className="flex items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={feeds.pane.searchPlaceholder}
          aria-label={feeds.pane.searchPlaceholder}
          className="min-w-0 flex-1 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm"
        />
        <RefreshButton onRefresh={refresh} />
        <button
          type="button"
          onClick={() => setManaging(value => !value)}
          className="rounded border border-white/15 px-2 py-1.5 text-xs"
        >
          {managing ? feeds.pane.doneManaging : feeds.pane.manageSources}
        </button>
      </div>
      <label className="flex items-center gap-1.5 text-xs opacity-70">
        <input type="checkbox" checked={unreadOnly} onChange={event => setUnreadOnly(event.target.checked)} />
        {feeds.pane.unreadOnly}
      </label>
      {managing ? (
        <ManageSources
          sources={sourcesQuery.data?.sources ?? []}
          providers={sourcesQuery.data?.providers ?? ['rss']}
          onChanged={() => {
            void queryClient.invalidateQueries({ queryKey: ['feeds', 'sources'] })
            void queryClient.invalidateQueries({ queryKey: ['feeds', 'items'] })
          }}
        />
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm font-medium">{query ? feeds.pane.noMatch(query) : feeds.pane.emptyTitle}</p>
          {!query && <p className="text-xs opacity-60">{feeds.pane.emptyDesc}</p>}
        </div>
      ) : (
        <div className="grid gap-2 overflow-y-auto">
          {items.map(item => (
            <FeedRow
              key={item.id}
              item={item}
              onChanged={() => void queryClient.invalidateQueries({ queryKey: ['feeds', 'items'] })}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function RefreshButton({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const feeds = useFeeds()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true)
          setError(null)
          void onRefresh().catch((err: unknown) =>
            setError(err instanceof Error ? err.message : String(err))
          ).finally(() => setBusy(false))
        }}
        className="rounded border border-white/15 px-2 py-1.5 text-xs disabled:opacity-50"
      >
        {busy ? feeds.pane.refreshing : feeds.pane.refresh}
      </button>
      {error && <span className="text-[11px] text-rose-300">{feeds.pane.pollFailed(error)}</span>}
    </span>
  )
}

function FeedRow({ item, onChanged }: { item: FeedItemView; onChanged: () => void }) {
  const feeds = useFeeds()
  const openOriginal = () => {
    if (item.url) void window.hermesDesktop?.openExternal(item.url)
  }
  const saveToSession = () => {
    newSessionInProfile($activeGatewayProfile.get())
    const brief = item.brief ? `${item.brief}\n\n${item.why_it_matters}`.trim() : item.title
    setComposerDraft(`${brief}\n\nSource: ${item.url || item.title}`)
  }
  const toggleRead = () => {
    void markFeedItemRead(item.id, !item.read).then(onChanged)
  }

  return (
    <div className={`flex flex-col gap-1 rounded border border-white/10 bg-white/[0.03] p-2.5 ${item.read ? 'opacity-60' : ''}`}>
      <p className="text-sm font-medium">{item.title}</p>
      {item.brief && <p className="text-xs opacity-80">{item.brief}</p>}
      {item.why_it_matters && <p className="text-xs opacity-60">{item.why_it_matters}</p>}
      <div className="mt-1 flex flex-wrap gap-1">
        {item.url && (
          <button type="button" onClick={openOriginal} className="rounded border border-white/15 px-1.5 py-0.5 text-[11px]">
            {feeds.pane.openOriginal}
          </button>
        )}
        <button type="button" onClick={saveToSession} className="rounded border border-white/15 px-1.5 py-0.5 text-[11px]">
          {feeds.pane.saveToSession}
        </button>
        <button type="button" onClick={toggleRead} className="rounded border border-white/15 px-1.5 py-0.5 text-[11px]">
          {item.read ? feeds.pane.markUnread : feeds.pane.markRead}
        </button>
      </div>
    </div>
  )
}

function ManageSources({
  sources,
  providers,
  onChanged,
}: {
  sources: FeedSourceView[]
  providers: string[]
  onChanged: () => void
}) {
  const feeds = useFeeds()
  const [showAdd, setShowAdd] = useState(false)
  const [providerStatus, setProviderStatus] = useState<Record<string, { connected: boolean }>>({})

  const refreshStatus = async () => {
    try {
      const status = await getFeedProviderStatus()
      setProviderStatus(status.providers)
    } catch {
      // Status is an affordance, not a gate: a failed read leaves the last
      // known state rather than blanking the panel.
    }
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto">
      {sources.map(source => (
        <SourceRow
          key={source.id}
          source={source}
          connected={providerStatus[source.provider]?.connected ?? source.connected}
          onChanged={() => {
            onChanged()
            void refreshStatus()
          }}
        />
      ))}
      {showAdd ? (
        <AddSourceForm
          providers={providers}
          onDone={() => {
            setShowAdd(false)
            onChanged()
            void refreshStatus()
          }}
          onCancel={() => setShowAdd(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setShowAdd(true)
            void refreshStatus()
          }}
          className="rounded border border-white/15 px-2 py-1.5 text-xs"
        >
          {feeds.pane.addSource}
        </button>
      )}
    </div>
  )
}

function SourceRow({
  source,
  connected,
  onChanged,
}: {
  source: FeedSourceView
  connected: boolean
  onChanged: () => void
}) {
  const feeds = useFeeds()
  const [token, setToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const needsToken = source.provider !== 'rss'

  const toggle = () => {
    void setFeedSourceEnabled(source.id, !source.enabled).then(onChanged)
  }
  const remove = () => {
    if (!window.confirm(feeds.pane.removeConfirm(source.name))) return
    void removeFeedSource(source.id).then(onChanged)
  }
  const connect = async () => {
    setConnecting(true)
    setConnectError(null)
    try {
      await validateFeedProvider(source.provider, token)
      await setEnvVar(providerTokenEnv(source.provider), token)
      setToken('')
      onChanged()
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : String(err))
    } finally {
      setConnecting(false)
    }
  }
  const disconnect = async () => {
    await deleteEnvVar(providerTokenEnv(source.provider))
    onChanged()
  }

  return (
    <div className="flex flex-col gap-1.5 rounded border border-white/10 bg-white/[0.03] p-2.5">
      <div className="flex items-center gap-1.5">
        <p className="flex-1 truncate text-sm font-medium">{source.name}</p>
        <span className="font-mono text-[10px] uppercase opacity-60">{source.provider}</span>
        {needsToken && (
          <span className={`font-mono text-[10px] uppercase ${connected ? 'text-emerald-300' : 'text-amber-300'}`}>
            {connected ? feeds.pane.connected : feeds.pane.needsReconnect}
          </span>
        )}
      </div>
      {source.last_error && <p className="text-[11px] text-rose-300">{source.last_error}</p>}
      {!source.last_error && source.consecutive_failures > 0 && (
        <p className="text-[11px] opacity-60">{feeds.pane.lastPolledNever}</p>
      )}
      {needsToken && !connected && (
        <div className="flex flex-col gap-1.5">
          <input
            type="password"
            value={token}
            onChange={event => setToken(event.target.value)}
            placeholder={feeds.pane.tokenPlaceholder}
            aria-label={feeds.pane.tokenPlaceholder}
            className="w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs"
          />
          <p className="text-[11px] opacity-60">
            {tokenHelp(feeds.pane, source.provider)}
          </p>
          {connectError && (
            <p className="text-[11px] text-rose-300" role="alert">
              {connectError}
            </p>
          )}
          <button
            type="button"
            onClick={() => void connect()}
            disabled={connecting || !token.trim()}
            className="rounded border border-white/15 px-2 py-1 text-xs disabled:opacity-50"
          >
            {connecting ? feeds.pane.connecting : feeds.pane.connect}
          </button>
        </div>
      )}
      {needsToken && connected && (
        <button
          type="button"
          onClick={() => void disconnect()}
          className="rounded border border-white/15 px-2 py-1 text-xs"
        >
          {feeds.pane.disconnect}
        </button>
      )}
      <div className="flex gap-1">
        <button type="button" onClick={toggle} className="rounded border border-white/15 px-1.5 py-0.5 text-[11px]">
          {source.enabled ? feeds.pane.disable : feeds.pane.enable}
        </button>
        <button type="button" onClick={remove} className="rounded border border-white/15 px-1.5 py-0.5 text-[11px]">
          {feeds.pane.remove}
        </button>
      </div>
    </div>
  )
}

function AddSourceForm({
  providers,
  onDone,
  onCancel,
}: {
  providers: string[]
  onDone: () => void
  onCancel: () => void
}) {
  const feeds = useFeeds()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [provider, setProvider] = useState('rss')
  const [interval, setInterval] = useState('60')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await addFeedSource({
        name: name.trim() || url.trim(),
        url: provider === 'rss' ? url.trim() : `${provider}://connected-account`,
        provider,
        interval_minutes: Math.max(5, Number.parseInt(interval, 10) || 60),
      })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-white/10 bg-white/[0.03] p-2.5">
      <label className="flex flex-col gap-1 text-xs">
        {feeds.pane.sourceName}
        <input
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder={feeds.pane.sourceNamePlaceholder}
          className="rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Provider
        <select value={provider} onChange={event => setProvider(event.target.value)} className="rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs">
          {providers.map(id => (
            <option key={id} value={id}>
              {providerLabel(feeds.pane, id)}
            </option>
          ))}
        </select>
      </label>
      {provider === 'rss' && (
        <label className="flex flex-col gap-1 text-xs">
          {feeds.pane.sourceUrl}
          <input
            value={url}
            onChange={event => setUrl(event.target.value)}
            placeholder={feeds.pane.sourceUrlPlaceholder}
            className="rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs"
          />
        </label>
      )}
      <label className="flex flex-col gap-1 text-xs">
        {feeds.pane.intervalMinutes}
        <input
          value={interval}
          onChange={event => setInterval(event.target.value)}
          inputMode="numeric"
          className="rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs"
        />
      </label>
      {error && (
        <p className="text-[11px] text-rose-300" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || (provider === 'rss' && !url.trim())}
          className="rounded border border-white/15 px-2 py-1 text-xs disabled:opacity-50"
        >
          {feeds.pane.addSource}
        </button>
        <button type="button" onClick={onCancel} className="rounded border border-white/15 px-2 py-1 text-xs">
          {feeds.pane.doneManaging}
        </button>
      </div>
    </div>
  )
}
