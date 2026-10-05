/**
 * Minerva Feeds — curated sources with ingest-time briefs, docked beside the
 * Bots roster. Reading is cached: the pane renders stored briefs and never
 * summarizes at render. Polling and summarization happen backend-side on
 * refresh. Ships with the app; disable here if unwanted.
 */

import { LocalizedTabTitle, translateNow } from '@hermes/plugin-sdk'
import type { PluginContext } from '@hermes/plugin-sdk'

import { FeedsPane } from './feeds-pane'
import { FEEDS_LOCALES } from './i18n'
import { ID, setPluginCtx } from './shared'

export default {
  id: ID,
  name: translateNow('common.feeds'),
  description:
    'Feeds — curated RSS and connected-account sources with briefs. Ships with the app; disable here if unwanted.',
  register(ctx: PluginContext) {
    setPluginCtx(ctx)
    const disposeLocales = ctx.i18n.register(FEEDS_LOCALES)

    ctx.register({
      id: 'pane',
      area: 'panes',
      // `title` is sampled at register (module import, before the locale has
      // loaded) — the tab renders `tabTitle` below so FEEDS follows the locale.
      title: translateNow('common.feeds'),
      data: {
        placement: 'left',
        width: '300px',
        collapsible: true,
        hideOnly: true,
        tabTitle: () => <LocalizedTabTitle select={t => t.common.feeds} />,
        tabTitleText: () => translateNow('common.feeds'),
        dock: {
          pane: 'sessions',
          pos: 'center',
          enforce: true,
        },
      },
      render: () => <FeedsPane />,
    })

    return () => {
      disposeLocales()
      setPluginCtx(null)
    }
  },
}
