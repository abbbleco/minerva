/**
 * Minerva Goals — tracked goals with agent-detected completion, docked beside
 * the Bots roster and Feeds. Extends the existing /goal machine (one active
 * session goal) with a per-profile registry: plural named goals, an audit
 * history, a confirmation inbox for proposed completions, and an explicit
 * kanban bridge. Ships with the app; disable here if unwanted.
 */

import { LocalizedTabTitle, translateNow } from '@hermes/plugin-sdk'
import type { PluginContext } from '@hermes/plugin-sdk'

import { GoalsPane } from './goals-pane'
import { GOALS_LOCALES } from './i18n'
import { ID, setPluginCtx } from './shared'

export default {
  id: ID,
  name: translateNow('common.goals'),
  description:
    'Goals — tracked goals with agent-detected completion. Ships with the app; disable here if unwanted.',
  register(ctx: PluginContext) {
    setPluginCtx(ctx)
    const disposeLocales = ctx.i18n.register(GOALS_LOCALES)

    ctx.register({
      id: 'pane',
      area: 'panes',
      // `title` is sampled at register (module import, before the locale has
      // loaded) — the tab renders `tabTitle` below so GOALS follows the locale.
      title: translateNow('common.goals'),
      data: {
        placement: 'left',
        width: '300px',
        collapsible: true,
        hideOnly: true,
        tabTitle: () => <LocalizedTabTitle select={t => t.common.goals} />,
        tabTitleText: () => translateNow('common.goals'),
        dock: {
          pane: 'sessions',
          pos: 'center',
          enforce: true,
        },
      },
      render: () => <GoalsPane />,
    })

    return () => {
      disposeLocales()
      setPluginCtx(null)
    }
  },
}
