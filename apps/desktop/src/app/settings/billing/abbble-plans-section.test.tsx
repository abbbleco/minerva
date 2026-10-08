import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/i18n'

import { type AbbblePlan, AbbblePlansSection } from './abbble-plans-section'

const PLANS: AbbblePlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'usd',
    credits: 0,
    rollover_cap: 0,
    features: ['Free models only'],
    cta: 'Try Minerva',
    subscribe_url: 'https://portal.abbble.co.za/signup'
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 20,
    currency: 'usd',
    credits: 22,
    rollover_cap: 10,
    bonus: '10%',
    highlight: true,
    features: ['$22 monthly credits', '$10 rollover cap'],
    cta: 'Get Minerva',
    subscribe_url: 'https://portal.abbble.co.za/plans'
  }
]

function renderSection(fetchImpl: () => Promise<Response>) {
  vi.stubGlobal('fetch', fetchImpl as unknown as typeof fetch)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  const tree = (children: ReactNode) => (
    <I18nProvider configClient={null} initialLocale="en">
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </I18nProvider>
  )

  render(tree(<AbbblePlansSection />))
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('AbbblePlansSection', () => {
  it('renders live portal tiers with prices, credits and subscribe links', async () => {
    renderSection(async () => ({ ok: true, json: async () => ({ plans: PLANS }) }) as unknown as Response)

    await waitFor(() => expect(screen.getByText('$20')).toBeTruthy())
    expect(screen.getByText('ABBBLE Portal plans')).toBeTruthy()
    expect(screen.getByText((_, el) => el?.textContent === '• $22 monthly credits')).toBeTruthy()
    const cta = screen.getByRole('button', { name: /Get Minerva/ })
    expect(cta).toBeTruthy()
  })

  it('hides quietly when the portal is unreachable', async () => {
    renderSection(async () => {
      throw new Error('offline')
    })
    // Loading state shows first, then the section unmounts on error.
    await waitFor(() => expect(screen.queryByText('Loading plans…')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('ABBBLE Portal plans')).toBeNull(), { timeout: 3000 })
  })
})
