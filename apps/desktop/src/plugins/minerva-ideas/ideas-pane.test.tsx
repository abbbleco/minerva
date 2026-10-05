import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IdeasPane } from './ideas-pane'

const mocks = vi.hoisted(() => ({
  subscriptionData: null as null | { current?: { tier_id?: string }; logged_in?: boolean },
  openSession: vi.fn(),
  setDraft: vi.fn(),
  requestBillingSettings: vi.fn(),
}))

vi.mock('./i18n', () => ({
  useIdeas: () => ({
    pane: {
      searchPlaceholder: 'Search ideas…',
      tryIt: 'Try it',
      premiumLocked: 'Premium',
      emptyTitle: 'No ideas yet',
      emptyDesc: 'Ideas live here once they load.',
      noMatch: (query: string) => `Nothing matches “${query}”.`,
    },
    categories: {
      write: { label: 'Write' },
      code: { label: 'Code' },
      research: { label: 'Research' },
      organize: { label: 'Organize' },
      communicate: { label: 'Communicate' },
      learn: { label: 'Learn' },
      automate: { label: 'Automate' },
      analyze: { label: 'Analyze' },
    },
    cards: {
      'draft-email': { title: 'Draft a difficult email', pitch: 'Polite but firm.', starter: 'Help me draft: ' },
      'automate-task': { title: 'Automate a repetitive task', pitch: 'Describe the chore.', starter: 'Automate: ' },
    },
  }),
}))

vi.mock('@/app/settings/billing/use-billing-state', () => ({
  useSubscriptionState: () => ({ data: mocks.subscriptionData }),
}))

vi.mock('@/store/billing-block', () => ({
  requestBillingSettings: (...args: unknown[]) => mocks.requestBillingSettings(...args),
}))

vi.mock('@/store/profile', () => ({
  newSessionInProfile: (...args: unknown[]) => mocks.openSession(...args),
  $activeGatewayProfile: { get: () => 'default' },
}))

vi.mock('@/store/composer', () => ({
  setComposerDraft: (...args: unknown[]) => mocks.setDraft(...args),
}))

/**
 * The `data` module is real (12 cards); the i18n mock above only carries copy
 * for two of them (`draft-email`, `automate-task`). Cards without copy render
 * nothing by design, so the pane shows exactly the mocked rows and the test
 * stays hermetic to translator progress.
 */
describe('IdeasPane', () => {
  beforeEach(() => {
    mocks.subscriptionData = null
    mocks.openSession.mockClear()
    mocks.setDraft.mockClear()
    mocks.requestBillingSettings.mockClear()
  })

  it('renders rows and filters by search', async () => {
    render(<IdeasPane />)
    expect(screen.getByText('Draft a difficult email')).toBeTruthy()
    expect(screen.getByText('Automate a repetitive task')).toBeTruthy()

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'email' } })
    expect(screen.queryByText('Draft a difficult email')).toBeTruthy()
    expect(screen.queryByText('Automate a repetitive task')).toBeNull()
  })

  it('shows no-match copy for empty results', async () => {
    render(<IdeasPane />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz-no-such-idea' } })
    expect(screen.getByText(/Nothing matches/)).toBeTruthy()
  })

  it('launches a free card into a fresh session with the starter pre-filled', async () => {
    mocks.subscriptionData = { current: { tier_id: 'super' } }
    render(<IdeasPane />)
    fireEvent.click(screen.getAllByText('Try it')[0]!)
    expect(mocks.openSession).toHaveBeenCalledWith('default')
    expect(mocks.setDraft).toHaveBeenCalledWith('Help me draft: ')
  })

  it('locks premium cards for free tiers and routes the lock to billing settings', async () => {
    mocks.subscriptionData = { current: { tier_id: 'free' } }
    render(<IdeasPane />)
    expect(screen.getAllByText(/Premium/).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /Premium/ }))
    expect(mocks.requestBillingSettings).toHaveBeenCalledOnce()
    expect(mocks.openSession).not.toHaveBeenCalled()
  })
})
