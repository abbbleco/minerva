import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LeadsPane, canReply } from './leads-pane'

const mocks = vi.hoisted(() => ({
  subscriptionData: null as null | { ok: boolean; data?: { current?: { tier_id?: string } } },
  requestBillingSettings: vi.fn(),
  contacts: [] as Array<Record<string, unknown>>,
  detail: null as null | { contact: Record<string, unknown>; messages: Array<Record<string, unknown>> },
  intake: null as null | { events: Array<Record<string, unknown>> },
  getLeads: vi.fn(async () => ({ contacts: [] })),
  getLead: vi.fn(async (_id: string) => ({ contact: {}, messages: [] })),
  getLeadIntake: vi.fn(async (_id: string) => ({ events: [] })),
  patchLead: vi.fn(async (_id: string, _body: unknown) => ({ override: {}, contact: null })),
  replyLead: vi.fn(async (_id: string, _text: string) => ({ ok: true, contact_id: _id, platform: 'telegram', chat_id: '42' })),
}))

vi.mock('./i18n', () => ({
  useLeads: () => ({
    pane: {
      searchPlaceholder: 'Search contacts…',
      allChannels: 'All channels',
      mutedTitle: 'Muted',
      emptyTitle: 'No contacts yet',
      emptyDesc: 'Humans you talk to appear here.',
      noMatch: (query: string) => `Nothing matches “${query}”.`,
      backToList: 'Back',
      replyLabel: 'Reply',
      replyPlaceholder: 'Type a reply…',
      send: 'Send',
      sending: 'Sending…',
      replySent: 'Sent.',
      confirmSend: (name: string) => `Send this reply to ${name}?`,
      mute: 'Mute',
      unmute: 'Unmute',
      pin: 'Pin',
      unpin: 'Unpin',
      editNote: 'Note',
      notePlaceholder: 'Remember…',
      saveNote: 'Save',
      cancel: 'Cancel',
      channelsLabel: 'Channels',
      emailsLabel: 'Email',
      phonesLabel: 'Phone',
      noteLabel: 'Note',
      alsoOnLabel: 'Also on',
      merge: 'Merge',
      mergeTitle: 'Merge into…',
      mergeHere: 'Merge here',
      unmerge: 'Unmerge',
      mergedFromLabel: 'Merged',
      intakeTitle: 'Form submissions',
      groupReadOnly: 'Group chats are read-only in this version.',
      formNoChat: 'Form leads have no chat channel — reply by email.',
      sendingAs: (platform: string) => `Sends as your connected ${platform} account.`,
      premiumTitle: 'LEADS is a premium surface',
      premiumDesc: 'The inbox lives on paid plans.',
      viewPlans: 'View plans',
      loadFailed: (error: string) => `Couldn’t load contacts: ${error}`,
      actionFailed: (error: string) => `Action failed: ${error}`,
    },
  }),
}))

vi.mock('@/app/settings/billing/use-billing-state', () => ({
  useSubscriptionState: () => ({ data: mocks.subscriptionData }),
}))

vi.mock('@/store/billing-block', () => ({
  requestBillingSettings: () => mocks.requestBillingSettings(),
}))

vi.mock('@/api/leads', () => ({
  getLeads: async () => ({ contacts: mocks.contacts }),
  getLead: async (_id: string) => mocks.detail ?? { contact: {}, messages: [] },
  getLeadIntake: async (_id: string) => mocks.intake ?? { events: [] },
  patchLead: (id: string, body: unknown) => mocks.patchLead(id, body),
  replyLead: (id: string, text: string) => mocks.replyLead(id, text),
}))

function renderPane() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <LeadsPane />
    </QueryClientProvider>
  )
}

function paidSubscription() {
  mocks.subscriptionData = { ok: true, data: { current: { tier_id: 'super' } } }
}

function contact(overrides: Record<string, unknown>) {
  return {
    id: 'c1',
    display_name: 'Ada',
    platform: 'telegram',
    channels: [{ platform: 'telegram', chat_type: 'dm', chat_id: '42', thread_id: null, scope_id: null, session_key: 'k', last_active: 100 }],
    emails: [],
    phones: [],
    first_seen_at: 1,
    last_seen_at: 100,
    snippet: 'Ada: hi',
    snippet_at: 90,
    unread: 1,
    muted: false,
    pinned: false,
    note: '',
    also_on: [] as Array<{ contact_id: string; display_name: string; via: string }>,
    merged_into: null as string | null,
    merged_from: [] as Array<{ contact_id: string; display_name: string }>,
    ...overrides,
  }
}

describe('LeadsPane', () => {
  beforeEach(() => {
    mocks.subscriptionData = null
    mocks.contacts = []
    mocks.detail = null
    mocks.intake = null
    mocks.requestBillingSettings.mockClear()
    for (const fn of [mocks.getLeads, mocks.getLead, mocks.getLeadIntake, mocks.patchLead, mocks.replyLead]) {
      fn.mockClear()
    }
  })

  it('locks the whole pane for free tiers with an upsell', () => {
    mocks.subscriptionData = { ok: true, data: { current: { tier_id: 'free' } } }
    renderPane()
    expect(screen.getByText('LEADS is a premium surface')).toBeTruthy()
    expect(screen.queryByPlaceholderText('Search contacts…')).toBeNull()
  })

  it('renders contacts with unread dots and channel badges', async () => {
    paidSubscription()
    mocks.contacts = [contact({}), contact({ id: 'c2', display_name: 'Bo', platform: 'whatsapp', snippet: '', unread: 0 })]
    renderPane()
    expect(await screen.findByText('Ada')).toBeTruthy()
    // Each platform appears twice: once as a filter chip, once as a row badge.
    expect(screen.getAllByText('telegram')).toHaveLength(2)
    expect(screen.getAllByText('whatsapp')).toHaveLength(2)
    expect(screen.getByLabelText('1 unread')).toBeTruthy()
  })

  it('opens the detail view with messages and sends a confirmed reply', async () => {
    paidSubscription()
    mocks.contacts = [contact({})]
    mocks.detail = {
      contact: contact({}),
      messages: [{ role: 'user', text: 'hi there', timestamp: 90 }],
    }
    renderPane()
    await screen.findByText('Ada')
    fireEvent.click(screen.getByText('Ada'))
    expect(await screen.findByText('hi there')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Type a reply…'), { target: { value: 'Hello!' } })
    fireEvent.click(screen.getByText('Send'))
    expect(screen.getByText('Send this reply to Ada?')).toBeTruthy()
    // The composer Send is replaced by the confirm dialog's Send.
    fireEvent.click(screen.getByText('Send'))
    await waitFor(() => expect(mocks.replyLead).toHaveBeenCalledWith('c1', 'Hello!'))
    expect(await screen.findByText('Sent.')).toBeTruthy()
  })

  it('shows read-only notes for group and form contacts', async () => {
    paidSubscription()
    mocks.contacts = [
      contact({ id: 'g1', display_name: 'Support', platform: 'telegram',
        channels: [{ platform: 'telegram', chat_type: 'group', chat_id: '-1001', thread_id: null, scope_id: null, session_key: 'kg', last_active: 50 }] }),
    ]
    mocks.detail = {
      contact: contact({ id: 'g1', display_name: 'Support', platform: 'telegram',
        channels: [{ platform: 'telegram', chat_type: 'group', chat_id: '-1001', thread_id: null, scope_id: null, session_key: 'kg', last_active: 50 }] }),
      messages: [],
    }
    renderPane()
    await screen.findByText('Support')
    fireEvent.click(screen.getByText('Support'))
    expect(await screen.findByText('Group chats are read-only in this version.')).toBeTruthy()
    expect(screen.queryByPlaceholderText('Type a reply…')).toBeNull()
  })

  it('mutes a contact from the detail view', async () => {
    paidSubscription()
    mocks.contacts = [contact({})]
    mocks.detail = { contact: contact({}), messages: [] }
    renderPane()
    await screen.findByText('Ada')
    fireEvent.click(screen.getByText('Ada'))
    expect(await screen.findByText(/Channels/)).toBeTruthy()
    fireEvent.click(screen.getByText('Mute'))
    await waitFor(() => expect(mocks.patchLead).toHaveBeenCalledWith('c1', { muted: true }))
  })

  it('shows cross-channel hints on the detail view', async () => {
    paidSubscription()
    const hinted = contact({
      also_on: [{ contact_id: 'c2', display_name: 'Example Ltd', via: 'phone 15551234567' }],
    })
    mocks.contacts = [hinted]
    mocks.detail = { contact: hinted, messages: [] }
    renderPane()
    await screen.findByText('Ada')
    fireEvent.click(screen.getByText('Ada'))
    expect(await screen.findByText(/Also on/)).toBeTruthy()
    expect(screen.getByText(/Example Ltd/)).toBeTruthy()
  })

  it('merges a contact into a picked target', async () => {
    paidSubscription()
    mocks.contacts = [contact({}), contact({ id: 'c2', display_name: 'Bo', snippet: '' })]
    mocks.detail = { contact: contact({}), messages: [] }
    renderPane()
    await screen.findByText('Ada')
    fireEvent.click(screen.getByText('Ada'))
    await screen.findByText(/Channels/)
    fireEvent.click(screen.getByText('Merge'))
    expect(await screen.findByText('Merge into…')).toBeTruthy()
    fireEvent.click(screen.getAllByText('Merge here')[0])
    await waitFor(() => expect(mocks.patchLead).toHaveBeenCalledWith('c1', { merged_into: 'c2' }))
  })

  it('unmerges an absorbed contact from the target', async () => {
    paidSubscription()
    const target = contact({ merged_from: [{ contact_id: 'c2', display_name: 'Bo' }] })
    mocks.contacts = [target]
    mocks.detail = { contact: target, messages: [] }
    renderPane()
    await screen.findByText('Ada')
    fireEvent.click(screen.getByText('Ada'))
    expect(await screen.findByText('Bo')).toBeTruthy()
    fireEvent.click(screen.getByText('Unmerge'))
    await waitFor(() => expect(mocks.patchLead).toHaveBeenCalledWith('c2', { merged_into: '' }))
  })

  it('shows form submission intake on form contacts', async () => {
    paidSubscription()
    const form = contact({
      id: 'cf', display_name: 'Example Ltd', platform: 'form',
      channels: [{ platform: 'form', chat_type: 'form', chat_id: 'sub-1', thread_id: null, scope_id: null, session_key: '', last_active: 50 }],
    })
    mocks.contacts = [form]
    mocks.detail = { contact: form, messages: [] }
    mocks.intake = { events: [{ id: 'e1', text: 'Please add dark mode.', conversation_id: 'sub-1' }] }
    renderPane()
    await screen.findByText('Example Ltd')
    fireEvent.click(screen.getByText('Example Ltd'))
    expect(await screen.findByText('Form submissions')).toBeTruthy()
    expect(screen.getByText('Please add dark mode.')).toBeTruthy()
    expect(screen.getByText('Form leads have no chat channel — reply by email.')).toBeTruthy()
  })

  it('filters contacts by search', async () => {
    paidSubscription()
    mocks.contacts = [contact({}), contact({ id: 'c2', display_name: 'Bo', snippet: '' })]
    renderPane()
    await screen.findByText('Ada')
    fireEvent.change(screen.getByPlaceholderText('Search contacts…'), { target: { value: 'bo' } })
    expect(screen.queryByText('Ada')).toBeNull()
    expect(screen.getByText('Bo')).toBeTruthy()
  })
})

describe('canReply', () => {
  it('allows DM channels, refuses groups and form-only contacts', () => {
    const dm = { channels: [{ chat_type: 'dm' }] } as unknown as Parameters<typeof canReply>[0]
    const group = { channels: [{ chat_type: 'group' }] } as unknown as Parameters<typeof canReply>[0]
    const form = { channels: [{ chat_type: 'form' }] } as unknown as Parameters<typeof canReply>[0]
    const empty = { channels: [] } as unknown as Parameters<typeof canReply>[0]
    expect(canReply(dm)).toBe(true)
    expect(canReply(group)).toBe(false)
    expect(canReply(form)).toBe(false)
    expect(canReply(empty)).toBe(false)
  })
})
