/**
 * Minerva LEADS — the human inbox, docked beside Bots/Feeds/Goals/PRDs.
 * One directory for the humans reaching you across every connected channel
 * (messaging + web forms), derived from conversations that already happened,
 * with a reply box per contact. Replies send as the connected bot account
 * after an explicit confirm; nothing here messages anyone on its own.
 * Ships with the app; disable here if unwanted.
 */

import { LocalizedTabTitle, translateNow } from '@hermes/plugin-sdk'
import type { PluginContext } from '@hermes/plugin-sdk'

import { LeadsPane } from './leads-pane'
import { LEADS_LOCALES } from './i18n'
import { ID, setPluginCtx } from './shared'

export default {
  id: ID,
  name: translateNow('common.leads'),
  description:
    'LEADS — inbox for human contacts across channels, with replies. Ships with the app; disable here if unwanted.',
  register(ctx: PluginContext) {
    setPluginCtx(ctx)
    const disposeLocales = ctx.i18n.register(LEADS_LOCALES)

    ctx.register({
      id: 'pane',
      area: 'panes',
      // `title` is sampled at register (module import, before the locale has
      // loaded) — the tab renders `tabTitle` below so LEADS follows the locale.
      title: translateNow('common.leads'),
      data: {
        placement: 'left',
        width: '300px',
        collapsible: true,
        hideOnly: true,
        tabTitle: () => <LocalizedTabTitle select={t => t.common.leads} />,
        tabTitleText: () => translateNow('common.leads'),
        dock: {
          pane: 'sessions',
          pos: 'center',
          enforce: true,
        },
      },
      render: () => <LeadsPane />,
    })

    return () => {
      disposeLocales()
      setPluginCtx(null)
    }
  },
}
