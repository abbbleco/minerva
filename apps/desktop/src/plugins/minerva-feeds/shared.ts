/**
 * The pieces every Feeds module needs and no single module can own: the
 * plugin id and the `PluginContext` `register()` captures.
 *
 * Mutable state lives behind an accessor pair because an imported binding
 * cannot be reassigned — `register()` publishes the context once with
 * `setPluginCtx`, and every reader goes through `getPluginCtx()`.
 */

import type { PluginContext } from '@hermes/plugin-sdk'

export const ID = 'minerva-feeds'

/** Captured in register() so components can reach plugin storage. */
let pluginCtx: PluginContext | null = null

export function getPluginCtx(): PluginContext | null {
  return pluginCtx
}

export function setPluginCtx(ctx: PluginContext | null) {
  pluginCtx = ctx
}
