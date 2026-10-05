/**
 * Minerva Ideas — a gallery of what users can do with Minerva, docked beside
 * the Bots roster. Each card opens a fresh session with its starter pre-filled
 * in the composer; the user reviews and sends. Nothing executes on click.
 *
 * Content lives in the plugin locale bundles (`./i18n`, keyed by card id);
 * `./data` holds only non-verbal structure. Premium cards render locked for
 * free tiers with the shared billing-settings recovery action.
 */

import { LocalizedTabTitle, translateNow } from '@hermes/plugin-sdk'
import type { PluginContext } from '@hermes/plugin-sdk'

import { IDEAS_LOCALES } from './i18n'
import { IdeasPane } from './ideas-pane'
import { ID, setPluginCtx } from './shared'

export default {
  id: ID,
  name: translateNow('common.ideas'),
  description:
    'Ideas — a gallery of what you can do with Minerva. Ships with the app; disable here if unwanted.',
  register(ctx: PluginContext) {
    setPluginCtx(ctx)
    const disposeLocales = ctx.i18n.register(IDEAS_LOCALES)

    ctx.register({
      id: 'pane',
      area: 'panes',
      // `title` is sampled at register (module import, before the locale has
      // loaded) — the tab renders `tabTitle` below so IDEAS follows the locale.
      title: translateNow('common.ideas'),
      data: {
        placement: 'left',
        width: '260px',
        collapsible: true,
        hideOnly: true,
        tabTitle: () => <LocalizedTabTitle select={t => t.common.ideas} />,
        tabTitleText: () => translateNow('common.ideas'),
        dock: {
          pane: 'sessions',
          pos: 'center',
          enforce: true,
        },
      },
      render: () => <IdeasPane />,
    })

    return () => {
      disposeLocales()
      setPluginCtx(null)
    }
  },
}
