import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GoalsPane, statusLabel } from './goals-pane'

const mocks = vi.hoisted(() => ({
  subscriptionData: null as null | { ok: boolean; data?: { current?: { tier_id?: string } } },
  requestBillingSettings: vi.fn(),
  goals: [] as Array<Record<string, unknown>>,
  createGoal: vi.fn(async () => ({ goal: {} })),
  completeGoal: vi.fn(async () => ({ ok: true })),
  abandonGoal: vi.fn(async () => ({ ok: true })),
  pauseGoal: vi.fn(async () => ({ ok: true })),
  resumeGoal: vi.fn(async () => ({ ok: true })),
  confirmGoal: vi.fn(async () => ({ ok: true })),
  dismissGoal: vi.fn(async () => ({ ok: true })),
  reopenGoal: vi.fn(async () => ({ ok: true })),
  dispatchGoal: vi.fn(async () => ({ ok: true, task_id: 't_1', created: true, goal: {} })),
}))

vi.mock('./i18n', () => ({
  useGoals: () => ({
    pane: {
      searchPlaceholder: 'Search goals…',
      newGoal: 'New goal',
      titleLabel: 'Title',
      titlePlaceholder: 'Ship the premium goals pane',
      objectiveLabel: 'Objective (optional)',
      objectivePlaceholder: 'What outcome does this goal track?',
      verificationLabel: 'Done looks like (optional)',
      verificationPlaceholder: 'e.g. the pane renders',
      create: 'Create',
      cancel: 'Cancel',
      creating: 'Creating…',
      emptyTitle: 'No tracked goals yet',
      emptyDesc: 'Create one to track an outcome across turns.',
      noMatch: (query: string) => `Nothing matches “${query}”.`,
      inboxTitle: 'Proposed completions',
      inboxDesc: 'The judge thinks these goals may be done.',
      statusActive: 'Active',
      statusPaused: 'Paused',
      statusPending: 'Awaiting confirmation',
      statusComplete: 'Complete',
      statusAbandoned: 'Abandoned',
      confirm: 'Confirm',
      dismiss: 'Dismiss',
      complete: 'Complete',
      abandon: 'Abandon',
      pause: 'Pause',
      resume: 'Resume',
      reopen: 'Reopen',
      dispatch: 'Dispatch to kanban',
      dispatched: (taskId: string) => `Linked kanban task ${taskId}`,
      evidenceLabel: 'Evidence',
      historyLabel: 'History',
      premiumTitle: 'Goals is a premium surface',
      premiumDesc: 'Tracked goals live on paid plans.',
      viewPlans: 'View plans',
      loadFailed: (error: string) => `Couldn’t load goals: ${error}`,
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

vi.mock('@/api/goals', () => ({
  getGoals: async () => ({ goals: mocks.goals, statuses: [], pending: [] }),
  createGoal: (body: unknown) => mocks.createGoal(body),
  completeGoal: (id: string) => mocks.completeGoal(id),
  abandonGoal: (id: string) => mocks.abandonGoal(id),
  pauseGoal: (id: string) => mocks.pauseGoal(id),
  resumeGoal: (id: string) => mocks.resumeGoal(id),
  confirmGoal: (id: string) => mocks.confirmGoal(id),
  dismissGoal: (id: string) => mocks.dismissGoal(id),
  reopenGoal: (id: string) => mocks.reopenGoal(id),
  dispatchGoal: (id: string) => mocks.dispatchGoal(id),
}))

function renderPane() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <GoalsPane />
    </QueryClientProvider>
  )
}

function paidSubscription() {
  mocks.subscriptionData = { ok: true, data: { current: { tier_id: 'super' } } }
}

function goal(overrides: Record<string, unknown>) {
  return {
    id: 'g1',
    title: 'Ship the goals pane',
    contract: {},
    status: 'active',
    session_id: null,
    kanban_task_id: null,
    created_at: 1,
    updated_at: 1,
    history: [],
    ...overrides,
  }
}

describe('GoalsPane', () => {
  beforeEach(() => {
    mocks.subscriptionData = null
    mocks.goals = []
    mocks.requestBillingSettings.mockClear()
    for (const fn of [mocks.createGoal, mocks.completeGoal, mocks.abandonGoal, mocks.pauseGoal,
      mocks.resumeGoal, mocks.confirmGoal, mocks.dismissGoal, mocks.reopenGoal, mocks.dispatchGoal]) {
      fn.mockClear()
    }
  })

  it('locks the whole pane for free tiers with an upsell', () => {
    mocks.subscriptionData = { ok: true, data: { current: { tier_id: 'free' } } }
    renderPane()
    expect(screen.getByText('Goals is a premium surface')).toBeTruthy()
    expect(screen.queryByPlaceholderText('Search goals…')).toBeNull()
  })

  it('routes the lock to billing settings, not to a session', () => {
    mocks.subscriptionData = { ok: true, data: { current: { tier_id: 'free' } } }
    renderPane()
    fireEvent.click(screen.getByText('View plans'))
    expect(mocks.requestBillingSettings).toHaveBeenCalledOnce()
  })

  it('renders goals with status, contract and evidence', async () => {
    paidSubscription()
    mocks.goals = [
      goal({ contract: { verification: 'pane renders in all locales' },
             history: [{ ts: 2, trigger: 'proposed', evidence: 'the pane renders' }] }),
    ]
    renderPane()
    expect(await screen.findByText('Ship the goals pane')).toBeTruthy()
    expect(screen.getByText('Active')).toBeTruthy()
    expect(screen.getByText('pane renders in all locales')).toBeTruthy()
    expect(screen.getByText(/the pane renders/)).toBeTruthy()
  })

  it('shows pending completions in the confirmation inbox and confirms them', async () => {
    paidSubscription()
    mocks.goals = [goal({ id: 'p1', title: 'Draft the release notes', status: 'pending-confirmation' })]
    renderPane()
    expect(await screen.findByText('Proposed completions')).toBeTruthy()
    fireEvent.click(screen.getByText('Confirm'))
    await waitFor(() => expect(mocks.confirmGoal).toHaveBeenCalledWith('p1'))
  })

  it('dismisses a proposed completion', async () => {
    paidSubscription()
    mocks.goals = [goal({ id: 'p1', title: 'Draft the release notes', status: 'pending-confirmation' })]
    renderPane()
    await screen.findByText('Proposed completions')
    fireEvent.click(screen.getByText('Dismiss'))
    await waitFor(() => expect(mocks.dismissGoal).toHaveBeenCalledWith('p1'))
  })

  it('pauses and dispatches an active goal', async () => {
    paidSubscription()
    mocks.goals = [goal({ id: 'a1' })]
    renderPane()
    await screen.findByText('Ship the goals pane')
    fireEvent.click(screen.getByText('Pause'))
    await waitFor(() => expect(mocks.pauseGoal).toHaveBeenCalledWith('a1'))
    fireEvent.click(screen.getByText('Dispatch to kanban'))
    await waitFor(() => expect(mocks.dispatchGoal).toHaveBeenCalledWith('a1'))
  })

  it('offers reopen for completed goals and hides dispatch once linked', async () => {
    paidSubscription()
    mocks.goals = [goal({ id: 'c1', status: 'complete', kanban_task_id: 't_9' })]
    renderPane()
    await screen.findByText('Complete')
    expect(screen.queryByText('Dispatch to kanban')).toBeNull()
    fireEvent.click(screen.getByText('Reopen'))
    await waitFor(() => expect(mocks.reopenGoal).toHaveBeenCalledWith('c1'))
  })

  it('creates a goal with an objective and verification contract', async () => {
    paidSubscription()
    renderPane()
    fireEvent.click(screen.getByText('New goal'))
    fireEvent.change(screen.getByPlaceholderText('Ship the premium goals pane'), {
      target: { value: 'Finish phase 3' },
    })
    fireEvent.change(screen.getByPlaceholderText('What outcome does this goal track?'), {
      target: { value: 'Goals pane ships' },
    })
    fireEvent.change(screen.getByPlaceholderText('e.g. the pane renders'), {
      target: { value: 'tests green' },
    })
    fireEvent.click(screen.getByText('Create'))
    await waitFor(() => {
      expect(mocks.createGoal).toHaveBeenCalledWith({
        title: 'Finish phase 3',
        contract: { objective: 'Goals pane ships', verification: 'tests green' },
      })
    })
  })

  it('filters goals by search', async () => {
    paidSubscription()
    mocks.goals = [goal({ id: '1', title: 'Alpha goal' }), goal({ id: '2', title: 'Beta goal' })]
    renderPane()
    await screen.findByText('Alpha goal')
    fireEvent.change(screen.getByPlaceholderText('Search goals…'), { target: { value: 'beta' } })
    expect(screen.queryByText('Alpha goal')).toBeNull()
    expect(screen.getByText('Beta goal')).toBeTruthy()
  })
})

describe('statusLabel', () => {
  const pane = {
    statusActive: 'Active',
    statusPaused: 'Paused',
    statusPending: 'Awaiting confirmation',
    statusComplete: 'Complete',
    statusAbandoned: 'Abandoned',
  } as unknown as Parameters<typeof statusLabel>[0]

  it('maps known statuses and passes unknown ids through', () => {
    expect(statusLabel(pane, 'active')).toBe('Active')
    expect(statusLabel(pane, 'pending-confirmation')).toBe('Awaiting confirmation')
    expect(statusLabel(pane, 'complete')).toBe('Complete')
    expect(statusLabel(pane, 'weird')).toBe('weird')
  })
})
