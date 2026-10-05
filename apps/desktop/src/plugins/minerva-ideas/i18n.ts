/**
 * Plugin-scoped i18n for Ideas — bundles registered under the plugin id via
 * `ctx.i18n.register`, never touching core `en.ts`. Mirrors the kanban/bots
 * shape: `useIdeas()` binds the message SHAPE so components keep typed
 * `ideas.cards.<id>.title` access.
 *
 * Only strings Ideas OWNS live here: card copy, category labels, pane chrome.
 * Generic verbs (Cancel, Close, Loading…) resolve against core via `useI18n()`.
 *
 * Locales follow the established fallback chain (active locale → this
 * plugin's `en` → the key): `en` carries the full catalog; `ja`/`zh`/`zh-hant`
 * carry translated chrome, and card bodies fall back to English until
 * translators follow. That is the same contract Arabic already relies on.
 */

import { type PluginLocaleBundles, type PluginTranslate, usePluginI18n } from '@hermes/plugin-sdk'
import { useMemo } from 'react'

import { getPluginCtx } from './shared'

export type IdeaCardMessages = {
  title: string
  pitch: string
  starter: string
}

type IdeasMessages = {
  pane: {
    searchPlaceholder: string
    tryIt: string
    premiumLocked: string
    emptyTitle: string
    emptyDesc: string
    noMatch: (query: string) => string
  }
  categories: Record<string, { label: string }>
  cards: Record<string, IdeaCardMessages>
}

const en: IdeasMessages = {
  pane: {
    searchPlaceholder: 'Search ideas…',
    tryIt: 'Try it',
    premiumLocked: 'Premium',
    emptyTitle: 'No ideas yet',
    emptyDesc: 'Ideas live here once they load.',
    noMatch: query => `Nothing matches “${query}”.`,
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
    'draft-email': {
      title: 'Draft a difficult email',
      pitch: 'Polite but firm, in your voice, for the message you keep postponing.',
      starter: 'Help me draft a polite but firm email about: ',
    },
    'review-writing': {
      title: 'Review my writing',
      pitch: 'A second pair of eyes for tone, clarity and typos before you send.',
      starter: 'Please review the following text for tone, clarity and typos: ',
    },
    brainstorm: {
      title: 'Brainstorm ideas',
      pitch: 'Names, angles, gifts, plans — quantity first, judgment later.',
      starter: 'Brainstorm 10 ideas for: ',
    },
    'explain-code': {
      title: 'Explain unfamiliar code',
      pitch: 'Paste it in and get a plain-language walkthrough of what it does.',
      starter: 'Explain what the following code does, in plain language: ',
    },
    'debug-error': {
      title: 'Debug an error message',
      pitch: 'Paste the error and the surrounding context; get causes and fixes.',
      starter: 'Help me debug this error. Here is the message and context: ',
    },
    'learn-topic': {
      title: 'Learn something new',
      pitch: 'A short lesson with examples, then questions that check understanding.',
      starter: 'Teach me about the following, with examples, then quiz me: ',
    },
    'meeting-prep': {
      title: 'Prepare for a meeting',
      pitch: 'Talking points, likely questions, and the one thing to decide.',
      starter: 'Help me prepare for this meeting: ',
    },
    'summarize-thread': {
      title: 'Summarize a long thread',
      pitch: 'Paste a conversation and get decisions, owners and open loops.',
      starter: 'Summarize the following thread into decisions, owners and open loops: ',
    },
    'research-brief': {
      title: 'Brief me on a topic',
      pitch: 'A sourced overview with the state of play and open questions.',
      starter: 'Give me a sourced briefing on: ',
    },
    'plan-project': {
      title: 'Break down a project',
      pitch: 'From vague goal to ordered steps with owners and first actions.',
      starter: 'Break the following project into ordered steps with owners and first actions: ',
    },
    'analyze-data': {
      title: 'Make sense of pasted data',
      pitch: 'Paste a table or export; get patterns, outliers and caveats.',
      starter: 'Analyze the following data for patterns, outliers and caveats: ',
    },
    'automate-task': {
      title: 'Automate a repetitive task',
      pitch: 'Describe the chore; get a checklist or script plus a schedule.',
      starter: 'Help me automate the following repetitive task: ',
    },
  },
}

const ja: IdeasMessages = {
  pane: {
    searchPlaceholder: 'アイデアを検索…',
    tryIt: '試す',
    premiumLocked: 'プレミアム',
    emptyTitle: 'アイデアがありません',
    emptyDesc: '読み込み後にアイデアが表示されます。',
    noMatch: query => `「${query}」に一致するものがありません。`,
  },
  categories: {
    write: { label: '書く' },
    code: { label: 'コード' },
    research: { label: '調べる' },
    organize: { label: '整理' },
    communicate: { label: '伝える' },
    learn: { label: '学ぶ' },
    automate: { label: '自動化' },
    analyze: { label: '分析' },
  },
  cards: {},
}

const zh: IdeasMessages = {
  pane: {
    searchPlaceholder: '搜索想法…',
    tryIt: '试一试',
    premiumLocked: '高级版',
    emptyTitle: '暂无想法',
    emptyDesc: '加载后想法将显示在这里。',
    noMatch: query => `没有与“${query}”匹配的内容。`,
  },
  categories: {
    write: { label: '写作' },
    code: { label: '代码' },
    research: { label: '研究' },
    organize: { label: '整理' },
    communicate: { label: '沟通' },
    learn: { label: '学习' },
    automate: { label: '自动化' },
    analyze: { label: '分析' },
  },
  cards: {},
}

const zhHant: IdeasMessages = {
  pane: {
    searchPlaceholder: '搜尋想法…',
    tryIt: '試一試',
    premiumLocked: '進階版',
    emptyTitle: '暫無想法',
    emptyDesc: '載入後想法將顯示在這裡。',
    noMatch: query => `沒有與「${query}」相符的內容。`,
  },
  categories: {
    write: { label: '寫作' },
    code: { label: '程式' },
    research: { label: '研究' },
    organize: { label: '整理' },
    communicate: { label: '溝通' },
    learn: { label: '學習' },
    automate: { label: '自動化' },
    analyze: { label: '分析' },
  },
  cards: {},
}

export const IDEAS_LOCALES: PluginLocaleBundles = { en, ja, zh, 'zh-hant': zhHant }

// Bind the message SHAPE to a plugin translator: string leaves resolve now,
// function leaves forward their args through t(path, …).
type Bound<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : T[K] extends object
      ? Bound<T[K]>
      : string
}

function bind<T extends object>(t: PluginTranslate, template: T, prefix = ''): Bound<T> {
  const out = {} as Record<string, unknown>

  for (const [key, value] of Object.entries(template)) {
    const path = prefix ? `${prefix}.${key}` : key
    out[key] =
      typeof value === 'function'
        ? (...args: unknown[]) => t(path, ...args)
        : value && typeof value === 'object'
          ? bind(t, value as object, path)
          : t(path)
  }

  return out as Bound<T>
}

export type IdeasText = Bound<IdeasMessages>

/** The Ideas strings for the active locale — one hook every component reads. */
export function useIdeas(): IdeasText {
  const t = usePluginI18n('minerva-ideas')

  return useMemo(() => bind(t, en), [t])
}

/** Resolve a dotted path against the English bundle — the floor for a read
 *  that beats `ctx.i18n` into existence, so an unresolved key never ships as
 *  the literal `ideas.cards.x.title`. */
function english(key: string, ...args: unknown[]): string {
  const leaf = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], en)

  return typeof leaf === 'function' ? (leaf as (...a: unknown[]) => string)(...args) : String(leaf ?? key)
}

let bound: { text: IdeasText; translate: PluginTranslate } | null = null

/** `useIdeas` for the module-level functions a hook can't reach. Non-reactive
 *  on its own; every caller is invoked during a render that a core `useI18n()`
 *  already subscribes to, so a locale switch still repaints. Cached on
 *  translator identity: `bind` walks the whole tree, and these run per row. */
export function ideasText(): IdeasText {
  const translate = getPluginCtx()?.i18n?.t ?? english

  if (bound?.translate !== translate) {
    bound = { text: bind(translate, en), translate }
  }

  return bound.text
}
