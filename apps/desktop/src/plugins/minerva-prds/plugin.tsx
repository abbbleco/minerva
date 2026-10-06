/**
 * Minerva PRDs — the review queue for the intake pipeline, docked beside
 * Bots/Feeds/Goals. Triage drafts PRDs from conversations (gateway turns and
 * manual injections); humans approve/edit/reject here; approved PRDs dispatch
 * explicitly to kanban. Nothing reaches kanban without passing review.
 * Ships with the app; disable here if unwanted.
 */

import { LocalizedTabTitle, translateNow } from '@hermes/plugin-sdk'
import type { PluginContext } from '@hermes/plugin-sdk'

import { PrdsPane } from './prds-pane'
import { PRDS_LOCALES } from './i18n'
import { ID, setPluginCtx } from './shared'

export default {
  id: ID,
  name: translateNow('common.prds'),
  description:
    'PRDs — review queue for intake-drafted product requirements. Ships with the app; disable here if unwanted.',
  register(ctx: PluginContext) {
    setPluginCtx(ctx)
    const disposeLocales = ctx.i18n.register(PRDS_LOCALES)

    ctx.register({
      id: 'pane',
      area: 'panes',
      // `title` is sampled at register (module import, before the locale has
      // loaded) — the tab renders `tabTitle` below so PRDS follows the locale.
      title: translateNow('common.prds'),
      data: {
        placement: 'left',
        width: '300px',
        collapsible: true,
        hideOnly: true,
        tabTitle: () => <LocalizedTabTitle select={t => t.common.prds} />,
        tabTitleText: () => translateNow('common.prds'),
        dock: {
          pane: 'sessions',
          pos: 'center',
          enforce: true,
        },
      },
      render: () => <PrdsPane />,
    })

    return () => {
      disposeLocales()
      setPluginCtx(null)
    }
  },
}
