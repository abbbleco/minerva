import { describe, expect, it, vi } from 'vitest'

import plugin from './plugin'
import { ID } from './shared'

/**
 * Feeds pane layout contract, asserted by running the real `register()`
 * against a recording plugin context: the pane mounts in the `panes` area
 * and center-stacks into the sessions zone (a SESSIONS | FEEDS tab strip),
 * mirroring the Bots dock invariant so the sidebar never splits into
 * cramped panes.
 */
describe('feeds plugin registration', () => {
  function recordingCtx() {
    const registrations: Array<{ id: string; area: string; data?: Record<string, unknown>; render?: unknown }> = []
    return {
      registrations,
      ctx: {
        i18n: { register: vi.fn(() => () => {}) },
        register: (entry: { id: string; area: string; data?: Record<string, unknown>; render?: unknown }) => {
          registrations.push(entry)
          return () => {}
        },
      },
    }
  }

  it('identifies as the feeds plugin', () => {
    expect(plugin.id).toBe(ID)
    expect(ID).toBe('minerva-feeds')
  })

  it('docks the pane into the sessions strip', () => {
    const { ctx, registrations } = recordingCtx()
    const dispose = (plugin.register as (ctx: unknown) => () => void)(ctx)
    try {
      const pane = registrations.find(entry => entry.id === 'pane')
      expect(pane, 'pane registration missing').toBeDefined()
      expect(pane!.area).toBe('panes')
      const dock = pane!.data?.dock as { pane?: string; pos?: string; enforce?: boolean } | undefined
      expect(dock).toMatchObject({ pane: 'sessions', pos: 'center', enforce: true })
      expect(typeof pane!.render).toBe('function')
    } finally {
      dispose()
    }
  })

  it('registers locale bundles under the plugin', () => {
    const { ctx } = recordingCtx()
    const dispose = (plugin.register as (ctx: unknown) => () => void)(ctx)
    try {
      expect((ctx.i18n.register as ReturnType<typeof vi.fn>)).toHaveBeenCalledOnce()
    } finally {
      dispose()
    }
  })
})
