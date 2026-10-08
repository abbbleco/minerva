import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FeedsPane, providerLabel, tokenHelp } from './feeds-pane'

const mocks = vi.hoisted(() => ({
  subscriptionData: null as null | { ok: boolean; data?: { current?: { tier_id?: string } } },
  openSession: vi.fn(),
  setDraft: vi.fn(),
  openExternal: vi.fn(),
  requestBillingSettings: vi.fn(),
  setEnvVar: vi.fn(async (_key: string, _value: string) => ({ ok: true })),
  deleteEnvVar: vi.fn(async (_key: string) => ({ ok: true })),
  sources: [] as Array<Record<string, unknown>>,
  items: [] as Array<Record<string, unknown>>,
  providers: ['rss', 'facebook'],
  providerStatus: {} as Record<string, { connected: boolean }>,
}))

vi.mock('./i18n', () => ({
  useFeeds: () => ({
    pane: {
      searchPlaceholder: 'Search items…',
      refresh: 'Refresh',
      refreshing: 'Refreshing…',
      markRead: 'Mark read',
      markUnread: 'Mark unread',
      openOriginal: 'Open original',
      saveToSession: 'Save to session',
      emptyTitle: 'No feed items yet',
      emptyDesc: 'Add a source below, then refresh to pull the latest.',
      noMatch: (query: string) => `Nothing matches “${query}”.`,
      unreadOnly: 'Unread only',
      manageSources: 'Manage sources',
      doneManaging: 'Done',
      addSource: 'Add source',
      sourceName: 'Name',
      sourceNamePlaceholder: 'My feed',
      sourceUrl: 'Feed URL',
      sourceUrlPlaceholder: 'https://example.com/feed.xml',
      providerRss: 'RSS / Atom',
      providerFacebook: 'Facebook',
      providerInstagram: 'Instagram',
      intervalMinutes: 'Check every (minutes)',
      enable: 'Enable',
      disable: 'Disable',
      remove: 'Remove',
      removeConfirm: (name: string) => `Remove “${name}” and its items?`,
      connect: 'Connect',
      connecting: 'Connecting…',
      disconnect: 'Disconnect',
      connected: 'Connected',
      needsReconnect: 'Needs reconnect',
      tokenPlaceholder: 'Paste your access token',
      tokenHelpFacebook: 'Create a token, then paste it here.',
      tokenHelpInstagram: 'Connect a business account, then paste the token here.',
      lastPolledNever: 'Never polled',
      pollFailed: (error: string) => `Poll failed: ${error}`,
      premiumTitle: 'Feeds is a premium surface',
      premiumDesc: 'Curated feeds with briefs live on paid plans.',
      viewPlans: 'View plans',
    },
  }),
}))

vi.mock('@/app/settings/billing/use-billing-state', () => ({
  useSubscriptionState: () => ({ data: mocks.subscriptionData }),
}))

vi.mock('@/store/billing-block', () => ({
  requestBillingSettings: () => mocks.requestBillingSettings(),
}))

vi.mock('@/store/profile', () => ({
  newSessionInProfile: (profile: string) => mocks.openSession(profile),
  $activeGatewayProfile: { get: () => 'default' },
}))

vi.mock('@/store/composer', () => ({
  setComposerDraft: (text: string) => mocks.setDraft(text),
}))

vi.mock('@/api/config', () => ({
  setEnvVar: (key: string, value: string) => mocks.setEnvVar(key, value),
  deleteEnvVar: (key: string) => mocks.deleteEnvVar(key),
}))

vi.mock('@/api/feeds', () => ({
  getFeedSources: async () => ({ sources: mocks.sources, providers: mocks.providers }),
  addFeedSource: vi.fn(async () => ({ source: {} })),
  removeFeedSource: vi.fn(async () => ({ removed: true })),
  setFeedSourceEnabled: vi.fn(async () => ({ updated: true })),
  getFeedItems: async () => ({ items: mocks.items, unread: mocks.items.filter(i => !(i as { read: boolean }).read).length }),
  markFeedItemRead: vi.fn(async () => ({ updated: true })),
  pollFeeds: vi.fn(async () => ({ polled: [], new_items: 0, failed: {}, auth_failed: [] })),
  validateFeedProvider: vi.fn(async () => ({ ok: true, account: 'Ada' })),
  getFeedProviderStatus: async () => ({ providers: mocks.providerStatus }),
}))

function renderPane() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={client}>
      <FeedsPane />
    </QueryClientProvider>
  )
}

function paidSubscription() {
  mocks.subscriptionData = { ok: true, data: { current: { tier_id: 'super' } } }
}

/**
 * The `data` module is real (12 cards); the i18n mock above only carries copy
 * for two of them (`draft-email`, `automate-task`). Cards without copy render
 * nothing by design, so the pane shows exactly the mocked rows and the test
 * stays hermetic to translator progress.
 */
describe('FeedsPane', () => {
  beforeEach(() => {
    mocks.subscriptionData = null
    mocks.sources = []
    mocks.items = []
    mocks.providerStatus = {}
    mocks.openSession.mockClear()
    mocks.setDraft.mockClear()
    mocks.requestBillingSettings.mockClear()
    Object.defineProperty(window, 'hermesDesktop', {
      value: { openExternal: (url: string) => mocks.openExternal(url) },
      configurable: true,
    })
  })

  it('locks the whole pane for free tiers with an upsell', () => {
    mocks.subscriptionData = { ok: true, data: { current: { tier_id: 'free' } } }
    renderPane()
    expect(screen.getByText('Feeds is a premium surface')).toBeTruthy()
    expect(screen.queryByPlaceholderText('Search items…')).toBeNull()
  })

  it('routes the lock to billing settings, not to a session', () => {
    mocks.subscriptionData = { ok: true, data: { current: { tier_id: 'free' } } }
    renderPane()
    fireEvent.click(screen.getByText('View plans'))
    expect(mocks.requestBillingSettings).toHaveBeenCalledOnce()
    expect(mocks.openSession).not.toHaveBeenCalled()
  })

  it('renders items with briefs and filters by search', async () => {
    paidSubscription()
    mocks.items = [
      { id: '1', source_id: 's', title: 'Big news', url: 'https://example.invalid/1', brief: 'X happened.', why_it_matters: 'Because.', read: false },
      { id: '2', source_id: 's', title: 'Other thing', url: '', brief: '', why_it_matters: '', read: true },
    ]
    renderPane()
    expect(await screen.findByText('Big news')).toBeTruthy()
    expect(screen.getByText('X happened.')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Search items…'), { target: { value: 'other' } })
    expect(screen.queryByText('Big news')).toBeNull()
    expect(screen.getByText('Other thing')).toBeTruthy()
  })

  it('opens the original and saves briefs to a fresh session', async () => {
    paidSubscription()
    mocks.items = [
      { id: '1', source_id: 's', title: 'Big news', url: 'https://example.invalid/1', brief: 'X happened.', why_it_matters: 'Because.', read: false },
    ]
    renderPane()
    await screen.findByText('Big news')
    fireEvent.click(screen.getByText('Open original'))
    expect(mocks.openExternal).toHaveBeenCalledWith('https://example.invalid/1')
    fireEvent.click(screen.getByText('Save to session'))
    expect(mocks.openSession).toHaveBeenCalledWith('default')
    expect(mocks.setDraft).toHaveBeenCalledWith(expect.stringContaining('X happened.'))
  })

  it('shows the manage view with sources', async () => {
    paidSubscription()
    mocks.sources = [
      { id: 's1', name: 'Example', url: 'https://example.invalid/feed.xml', provider: 'rss', enabled: true, last_error: null, consecutive_failures: 0 },
    ]
    renderPane()
    fireEvent.click(screen.getByText('Manage sources'))
    expect(await screen.findByText('Example')).toBeTruthy()
  })

  it('surfaces provider reconnect state without secrets', async () => {
    paidSubscription()
    mocks.sources = [
      { id: 'fb1', name: 'Facebook', url: 'facebook://connected-account', provider: 'facebook', enabled: true, last_error: 'token expired', consecutive_failures: 3 },
    ]
    mocks.providerStatus = {}
    renderPane()
    fireEvent.click(screen.getByText('Manage sources'))
    expect(await screen.findByText('Needs reconnect')).toBeTruthy()
    expect(screen.getByText('token expired')).toBeTruthy()
  })

  it('adds an RSS source from the manage view', async () => {
    paidSubscription()
    const feedsApi = await import('@/api/feeds')
    renderPane()
    fireEvent.click(screen.getByText('Manage sources'))
    fireEvent.click(await screen.findByText('Add source'))
    fireEvent.change(screen.getByPlaceholderText('My feed'), { target: { value: 'Example' } })
    fireEvent.change(screen.getByPlaceholderText('https://example.com/feed.xml'), {
      target: { value: 'https://example.invalid/feed.xml' },
    })
    // The toggle is replaced by the form, so exactly one submit button exists.
    fireEvent.click(screen.getByText('Add source'))
    await waitFor(() => {
      expect((feedsApi.addFeedSource as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'rss', url: 'https://example.invalid/feed.xml' })
      )
    })
  })
})

describe('provider lookups', () => {
  const pane = {
    providerRss: 'RSS / Atom',
    providerFacebook: 'Facebook',
    providerInstagram: 'Instagram',
    tokenPlaceholder: 'Paste your access token',
    tokenHelpFacebook: 'Create a token, then paste it here.',
    tokenHelpInstagram: 'Connect a business account, then paste the token here.',
  } as unknown as Parameters<typeof providerLabel>[0]

  it('labels known providers and passes unknown ids through', () => {
    expect(providerLabel(pane, 'rss')).toBe('RSS / Atom')
    expect(providerLabel(pane, 'facebook')).toBe('Facebook')
    expect(providerLabel(pane, 'instagram')).toBe('Instagram')
    expect(providerLabel(pane, 'myspace')).toBe('myspace')
  })

  it('shows per-provider token help, generic placeholder otherwise', () => {
    expect(tokenHelp(pane, 'facebook')).toBe('Create a token, then paste it here.')
    expect(tokenHelp(pane, 'instagram')).toBe('Connect a business account, then paste the token here.')
    expect(tokenHelp(pane, 'rss')).toBe('Paste your access token')
    expect(tokenHelp(pane, 'myspace')).toBe('Paste your access token')
  })
})
