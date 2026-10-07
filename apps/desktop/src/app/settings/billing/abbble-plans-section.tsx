import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'
import { openExternalLink } from '@/lib/external-link'
import { ExternalLink, Package } from '@/lib/icons'
import { cn } from '@/lib/utils'

import { SettingsSection } from '../primitives'

export const ABBBLE_PORTAL_ORIGIN = 'https://portal.abbble.co.za'

export interface AbbblePlan {
  id: string
  name: string
  price: number
  currency: string
  credits: number
  rollover_cap: number
  bonus?: string
  highlight?: boolean
  features: string[]
  cta: string
  subscribe_url: string
}

export async function fetchAbbblePlans(origin: string = ABBBLE_PORTAL_ORIGIN): Promise<AbbblePlan[]> {
  const res = await fetch(`${origin.replace(/\/+$/, '')}/api/portal/plans`)
  if (!res.ok) throw new Error(`portal plans ${res.status}`)
  const json = (await res.json()) as { plans?: AbbblePlan[] }
  if (!Array.isArray(json.plans)) throw new Error('portal plans malformed')
  return json.plans
}

function money(price: number, currency: string): string {
  const code = currency.toUpperCase()
  if (code === 'USD') return `$${price}`
  if (code === 'ZAR') return `R${price}`
  return `${price} ${code}`
}

/** ABBBLE Portal plans — OUR tiers, fetched live from the portal (offline → hidden). */
export function AbbblePlansSection() {
  const { t } = useI18n()
  const pp = t.settings.billing.portalPlans
  const plans = useQuery({
    queryKey: ['abbble', 'plans'],
    queryFn: () => fetchAbbblePlans(),
    staleTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false
  })

  if (plans.isPending) {
    return (
      <SettingsSection icon={Package} title={pp.title}>
        <p className="text-[length:var(--conversation-caption-font-size)] text-(--ui-text-tertiary)">
          {pp.loading}
        </p>
      </SettingsSection>
    )
  }

  if (plans.isError || !plans.data?.length) {
    // The billing page must never break on a portal outage — hide quietly.
    return null
  }

  return (
    <SettingsSection icon={Package} title={pp.title}>
      <p className="mb-3 text-[length:var(--conversation-caption-font-size)] text-(--ui-text-tertiary)">
        {pp.subtitle}
      </p>
      <div className="@container">
        <div className="grid gap-3 @2xl:grid-cols-2 @4xl:grid-cols-4">
          {plans.data.map(tier => (
            <div
              key={tier.id}
              className={cn(
                'flex flex-col gap-1.5 rounded-xl border p-4',
                tier.highlight
                  ? 'border-transparent bg-[#1f22ff] text-white'
                  : 'border-(--ui-border) bg-(--ui-bg-quaternary)'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold tracking-widest uppercase">{tier.id}</span>
                {tier.bonus && (
                  <span className="rounded border border-current px-1.5 py-0.5 font-mono text-[10px]">
                    {tier.bonus} Bonus
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold">
                {money(tier.price, tier.currency)}{' '}
                <span className="text-xs font-normal opacity-70">{pp.perMonth}</span>
              </p>
              <ul className="space-y-1 text-[length:var(--conversation-caption-font-size)] opacity-85">
                {tier.features.map(f => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <div className="mt-auto pt-2">
                <Button
                  onClick={() => openExternalLink(tier.subscribe_url)}
                  size="sm"
                  type="button"
                  variant={tier.highlight ? 'default' : 'outline'}
                >
                  {tier.cta}
                  <ExternalLink className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SettingsSection>
  )
}
