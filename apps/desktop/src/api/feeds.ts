import {
  connectionScoped,
  hermesApi,
  profileScoped,
  STARTUP_REQUEST_TIMEOUT_MS
} from './client'

/**
 * Feeds API: sources, items, polling and provider onboarding for the Feeds
 * pane. Mirrors `api/cron.ts` — profile-scoped reads, same timeout posture.
 * Polling can run model summarization server-side, so it gets the generous
 * timeout rather than the interactive default.
 */
const POLL_REQUEST_TIMEOUT_MS = 300_000

export interface FeedSourceView {
  id: string
  name: string
  url: string
  provider: string
  interval_minutes: number
  enabled: boolean
  last_polled_at: number
  consecutive_failures: number
  last_error: string | null
  connected: boolean
}

export interface FeedItemView {
  id: string
  source_id: string
  title: string
  url: string
  published_at: string | null
  brief: string
  why_it_matters: string
  read: boolean
}

export interface FeedPollResult {
  polled: string[]
  new_items: number
  failed: Record<string, string>
  auth_failed: string[]
  summarized?: number
}

export function getFeedSources(profile?: string): Promise<{ sources: FeedSourceView[]; providers: string[] }> {
  const suffix = profile ? `?profile=${encodeURIComponent(profile)}` : ''
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: `/api/feeds/sources${suffix}`,
    timeoutMs: STARTUP_REQUEST_TIMEOUT_MS
  })
}

export function addFeedSource(body: {
  name: string
  url: string
  provider?: string
  interval_minutes?: number
  auth_ref?: string
}): Promise<{ source: FeedSourceView }> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: '/api/feeds/sources',
    method: 'POST',
    body
  })
}

export function removeFeedSource(sourceId: string): Promise<{ removed: boolean }> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: `/api/feeds/sources/${encodeURIComponent(sourceId)}`,
    method: 'DELETE'
  })
}

export function setFeedSourceEnabled(sourceId: string, enabled: boolean): Promise<{ updated: boolean }> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: `/api/feeds/sources/${encodeURIComponent(sourceId)}`,
    method: 'PATCH',
    body: { enabled }
  })
}

export function getFeedItems(options?: {
  source_id?: string
  unread_only?: boolean
  limit?: number
}): Promise<{ items: FeedItemView[]; unread: number }> {
  const params = new URLSearchParams()
  if (options?.source_id) params.set('source_id', options.source_id)
  if (options?.unread_only) params.set('unread_only', 'true')
  if (options?.limit) params.set('limit', String(options.limit))
  const suffix = params.size ? `?${params}` : ''
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: `/api/feeds/items${suffix}`,
    timeoutMs: STARTUP_REQUEST_TIMEOUT_MS
  })
}

export function markFeedItemRead(itemId: string, read = true): Promise<{ updated: boolean }> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: `/api/feeds/items/${encodeURIComponent(itemId)}`,
    method: 'PATCH',
    body: { read }
  })
}

export function pollFeeds(sourceId?: string): Promise<FeedPollResult> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: '/api/feeds/poll',
    method: 'POST',
    body: sourceId ? { source_id: sourceId } : {},
    timeoutMs: POLL_REQUEST_TIMEOUT_MS
  })
}

export function validateFeedProvider(provider: string, token: string): Promise<{ ok: boolean; account: string | null }> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: '/api/feeds/provider/validate',
    method: 'POST',
    body: { provider, token }
  })
}

export function getFeedProviderStatus(): Promise<{ providers: Record<string, { connected: boolean }> }> {
  return hermesApi({
    ...profileScoped(),
    ...connectionScoped(),
    path: '/api/feeds/providers/status',
    timeoutMs: STARTUP_REQUEST_TIMEOUT_MS
  })
}
