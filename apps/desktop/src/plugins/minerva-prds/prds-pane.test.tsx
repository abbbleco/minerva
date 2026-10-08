import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PrdsPane, statusLabel } from './prds-pane'

const mocks = vi.hoisted(() => ({
  subscriptionData: null as null | { ok: boolean; data?: { current?: { tier_id?: string } } },
  requestBillingSettings: vi.fn(),
  prds: [] as Array<Record<string, unknown>>,
  cases: [] as Array<Record<string, unknown>>,
  getPrds: vi.fn(async () => ({ prds: [] })),
  getPrdCases: vi.fn(async () => ({ cases: [] })),
  injectPrdIntake: vi.fn(async (_body: unknown) => ({ event_id: 'e1', conversation_id: 'e1', case: null })),
  reviewPrd: vi.fn(async (_id: string, _body: unknown) => ({ prd: {} })),
  dispatchPrd: vi.fn(async (_id: string) => ({ task_id: 't_1', created: true, child_ids: [] as string[] })),
}))

vi.mock('./i18n', () => ({
  usePrds: () => ({
    pane: {
      searchPlaceholder: 'Search PRDs…',
      newIntake: 'Add intake',
      intakeLabel: 'Paste a conversation',
      intakePlaceholder: 'Paste the feature discussion to triage…',
      inject: 'Submit',
      injecting: 'Submitting…',
      emptyTitle: 'No PRDs yet',
      emptyDesc: 'The pipeline drafts PRDs from conversations — review them here.',
      noMatch: (query: string) => `Nothing matches “${query}”.`,
      reviewTitle: 'Needs review',
      reviewDesc: 'Drafts from triage. Approve, edit, or reject each.',
      watchingTitle: 'Watching',
      watchingDesc: 'Conversations waiting for more context.',
      historyTitle: 'History',
      statusDraft: 'Draft',
      statusInReview: 'In review',
      statusApproved: 'Approved',
      statusRejected: 'Rejected',
      statusWatch: 'Watching',
      statusDismissed: 'Dismissed',
      problemLabel: 'Problem',
      usersLabel: 'Users',
      requirementsLabel: 'Requirements',
      acceptanceLabel: 'Acceptance criteria',
      questionsLabel: 'Open questions',
      sourcesLabel: 'Sources',
      conversationLabel: 'Conversation',
      startReview: 'Start review',
      approve: 'Approve',
      reject: 'Reject',
      revise: 'Edit',
      dispatch: 'Dispatch to kanban',
      dispatched: (taskId: string) => `Linked kanban task ${taskId}`,
      rejectReasonLabel: 'Rejection reason',
      rejectReasonPlaceholder: 'e.g. out of scope for now',
      reviseFieldLabel: 'Section',
      reviseValueLabel: 'Content (one item per line for lists)',
      save: 'Save',
      cancel: 'Cancel',
      premiumTitle: 'PRDs is a premium surface',
      premiumDesc: 'The intake-to-review PRD pipeline lives on paid plans.',
      viewPlans: 'View plans',
      loadFailed: (error: string) => `Couldn’t load PRDs: ${error}`,
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

vi.mock('@/api/prds', () => ({
  getPrds: async () => ({ prds: mocks.prds }),
  getPrdCases: async () => ({ cases: mocks.cases }),
  injectPrdIntake: (body: unknown) => mocks.injectPrdIntake(body),
  reviewPrd: (id: string, body: unknown) => mocks.reviewPrd(id, body),
  dispatchPrd: (id: string) => mocks.dispatchPrd(id),
}))

function renderPane() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={client}>
      <PrdsPane />
    </QueryClientProvider>
  )
}

function paidSubscription() {
  mocks.subscriptionData = { ok: true, data: { current: { tier_id: 'super' } } }
}

function prd(overrides: Record<string, unknown>) {
  return {
    id: 'p1',
    title: 'Export to CSV',
    problem: 'Users cannot get their data out.',
    users: 'Analysts',
    requirements: ['CSV export button'],
    acceptance_criteria: ['Button downloads a CSV'],
    open_questions: [],
    sources: ['e1'],
    status: 'draft',
    history: [],
    section_sources: {},
    conversation_id: 'conv-1',
    kanban_task_id: null,
    ...overrides,
  }
}

describe('PrdsPane', () => {
  beforeEach(() => {
    mocks.subscriptionData = null
    mocks.prds = []
    mocks.cases = []
    mocks.requestBillingSettings.mockClear()

    for (const fn of [mocks.getPrds, mocks.getPrdCases, mocks.injectPrdIntake, mocks.reviewPrd, mocks.dispatchPrd]) {
      fn.mockClear()
    }
  })

  it('locks the whole pane for free tiers with an upsell', () => {
    mocks.subscriptionData = { ok: true, data: { current: { tier_id: 'free' } } }
    renderPane()
    expect(screen.getByText('PRDs is a premium surface')).toBeTruthy()
    expect(screen.queryByPlaceholderText('Search PRDs…')).toBeNull()
  })

  it('renders drafts in the review section with actions', async () => {
    paidSubscription()
    mocks.prds = [prd({})]
    renderPane()
    expect(await screen.findByText('Needs review')).toBeTruthy()
    expect(screen.getByText('Export to CSV')).toBeTruthy()
    expect(screen.getByText('Draft')).toBeTruthy()
    expect(screen.getByText('Approve')).toBeTruthy()
    expect(screen.queryByText('Dispatch to kanban')).toBeNull()
  })

  it('approves a draft and dispatches an approved PRD', async () => {
    paidSubscription()
    mocks.prds = [prd({ id: 'p1' })]
    renderPane()
    await screen.findByText('Export to CSV')
    fireEvent.click(screen.getByText('Approve'))
    await waitFor(() => expect(mocks.reviewPrd).toHaveBeenCalledWith('p1', { action: 'approve' }))
  })

  it('dispatches an approved PRD without a linked task', async () => {
    paidSubscription()
    mocks.prds = [prd({ id: 'p2', title: 'Import', status: 'approved' })]
    renderPane()
    await screen.findByText('Import')
    expect(screen.queryByText('Approve')).toBeNull()
    fireEvent.click(screen.getByText('Dispatch to kanban'))
    await waitFor(() => expect(mocks.dispatchPrd).toHaveBeenCalledWith('p2'))
  })

  it('shows watch cases with their reason and hides dispatch once linked', async () => {
    paidSubscription()
    mocks.prds = [prd({ id: 'p3', status: 'approved', kanban_task_id: 't_9' })]
    mocks.cases = [{ id: 'c1', conversation_id: 'conv-9', status: 'watch', reason: 'vague ask', event_ids: ['e9'], prd_id: null, triage_count: 1, updated_at: 1 }]
    renderPane()
    const headings = await screen.findAllByText('Watching')
    expect(headings.length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('vague ask')).toBeTruthy()
    expect(screen.getByText('Linked kanban task t_9')).toBeTruthy()
    expect(screen.queryByText('Dispatch to kanban')).toBeNull()
  })

  it('rejects with a reason', async () => {
    paidSubscription()
    mocks.prds = [prd({ id: 'p4' })]
    renderPane()
    await screen.findByText('Export to CSV')
    fireEvent.click(screen.getByText('Reject'))
    fireEvent.change(screen.getByPlaceholderText('e.g. out of scope for now'), {
      target: { value: 'duplicate' },
    })
    // The row action hides once the reject form opens; the remaining Reject submits it.
    fireEvent.click(screen.getByText('Reject'))
    await waitFor(() => expect(mocks.reviewPrd).toHaveBeenCalledWith('p4', { action: 'reject', reason: 'duplicate' }))
  })

  it('injects pasted intake text', async () => {
    paidSubscription()
    renderPane()
    fireEvent.click(screen.getByText('Add intake'))
    fireEvent.change(screen.getByPlaceholderText('Paste the feature discussion to triage…'), {
      target: { value: 'We need export' },
    })
    fireEvent.click(screen.getByText('Submit'))
    await waitFor(() => {
      expect(mocks.injectPrdIntake).toHaveBeenCalledWith({ text: 'We need export' })
    })
  })

  it('filters PRDs by search', async () => {
    paidSubscription()
    mocks.prds = [prd({ id: '1', title: 'Alpha export' }), prd({ id: '2', title: 'Beta import' })]
    renderPane()
    await screen.findByText('Alpha export')
    fireEvent.change(screen.getByPlaceholderText('Search PRDs…'), { target: { value: 'beta' } })
    expect(screen.queryByText('Alpha export')).toBeNull()
    expect(screen.getByText('Beta import')).toBeTruthy()
  })
})

describe('statusLabel', () => {
  const pane = {
    statusDraft: 'Draft',
    statusInReview: 'In review',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',
    statusWatch: 'Watching',
    statusDismissed: 'Dismissed',
  } as unknown as Parameters<typeof statusLabel>[0]

  it('maps known statuses and passes unknown ids through', () => {
    expect(statusLabel(pane, 'draft')).toBe('Draft')
    expect(statusLabel(pane, 'in_review')).toBe('In review')
    expect(statusLabel(pane, 'approved')).toBe('Approved')
    expect(statusLabel(pane, 'weird')).toBe('weird')
  })
})
