/**
 * Plugin-scoped i18n for Goals — bundles registered under the plugin id via
 * `ctx.i18n.register`, never touching core `en.ts`. Mirrors the feeds/bots
 * shape: `useGoals()` binds the message SHAPE so components keep typed access.
 *
 * Only strings Goals OWNS live here. Generic verbs resolve against core via
 * `useI18n()`. Locales follow the established fallback chain (active locale
 * → this plugin's `en` → the key).
 */

import { type PluginLocaleBundles, type PluginTranslate, usePluginI18n } from '@hermes/plugin-sdk'
import { useMemo } from 'react'

import { getPluginCtx } from './shared'

export type GoalsMessages = {
  pane: {
    searchPlaceholder: string
    newGoal: string
    titleLabel: string
    titlePlaceholder: string
    objectiveLabel: string
    objectivePlaceholder: string
    verificationLabel: string
    verificationPlaceholder: string
    create: string
    cancel: string
    creating: string
    emptyTitle: string
    emptyDesc: string
    noMatch: (query: string) => string
    inboxTitle: string
    inboxDesc: string
    statusActive: string
    statusPaused: string
    statusPending: string
    statusComplete: string
    statusAbandoned: string
    confirm: string
    dismiss: string
    complete: string
    abandon: string
    pause: string
    resume: string
    reopen: string
    dispatch: string
    dispatched: (taskId: string) => string
    evidenceLabel: string
    historyLabel: string
    premiumTitle: string
    premiumDesc: string
    viewPlans: string
    loadFailed: (error: string) => string
    actionFailed: (error: string) => string
  }
}

const en: GoalsMessages = {
  pane: {
    searchPlaceholder: 'Search goals…',
    newGoal: 'New goal',
    titleLabel: 'Title',
    titlePlaceholder: 'Ship the premium goals pane',
    objectiveLabel: 'Objective (optional)',
    objectivePlaceholder: 'What outcome does this goal track?',
    verificationLabel: 'Done looks like (optional)',
    verificationPlaceholder: 'e.g. the pane renders and the judge proposes a completion',
    create: 'Create',
    cancel: 'Cancel',
    creating: 'Creating…',
    emptyTitle: 'No tracked goals yet',
    emptyDesc: 'Create one to track an outcome across turns — completion is detected and proposed.',
    noMatch: query => `Nothing matches “${query}”.`,
    inboxTitle: 'Proposed completions',
    inboxDesc: 'The judge thinks these goals may be done. Confirm or dismiss each.',
    statusActive: 'Active',
    statusPaused: 'Paused',
    statusPending: 'Awaiting confirmation',
    statusComplete: 'Complete',
    statusAbandoned: 'Abandoned',
    confirm: 'Confirm',
    dismiss: 'Dismiss',
    complete: 'Complete',
    abandon: 'Abandon',
    pause: 'Pause',
    resume: 'Resume',
    reopen: 'Reopen',
    dispatch: 'Dispatch to kanban',
    dispatched: taskId => `Linked kanban task ${taskId}`,
    evidenceLabel: 'Evidence',
    historyLabel: 'History',
    premiumTitle: 'Goals is a premium surface',
    premiumDesc: 'Tracked goals with agent-detected completion live on paid plans.',
    viewPlans: 'View plans',
    loadFailed: error => `Couldn’t load goals: ${error}`,
    actionFailed: error => `Action failed: ${error}`,
  },
}

const ja: GoalsMessages = {
  pane: {
    searchPlaceholder: 'ゴールを検索…',
    newGoal: '新しいゴール',
    titleLabel: 'タイトル',
    titlePlaceholder: 'プレミアムゴールパネルを完成させる',
    objectiveLabel: '目的（任意）',
    objectivePlaceholder: 'このゴールが追跡する成果は？',
    verificationLabel: '完了の条件（任意）',
    verificationPlaceholder: '例: パネルが表示され、判定が完了を提案する',
    create: '作成',
    cancel: 'キャンセル',
    creating: '作成中…',
    emptyTitle: '追跡中のゴールはありません',
    emptyDesc: 'ゴールを作成するとターンをまたいで成果を追跡し、完了を検出して提案します。',
    noMatch: query => `「${query}」に一致するものがありません。`,
    inboxTitle: '完了の提案',
    inboxDesc: '判定はこれらのゴールが完了した可能性があると考えています。確認するか却下してください。',
    statusActive: '進行中',
    statusPaused: '一時停止',
    statusPending: '確認待ち',
    statusComplete: '完了',
    statusAbandoned: '中止',
    confirm: '確認',
    dismiss: '却下',
    complete: '完了',
    abandon: '中止',
    pause: '一時停止',
    resume: '再開',
    reopen: '再開',
    dispatch: 'Kanbanへ送る',
    dispatched: taskId => `Kanbanタスク ${taskId} をリンクしました`,
    evidenceLabel: '根拠',
    historyLabel: '履歴',
    premiumTitle: 'ゴールはプレミアム機能です',
    premiumDesc: 'エージェントが完了を検出するゴール追跡は有料プランで利用できます。',
    viewPlans: 'プランを見る',
    loadFailed: error => `ゴールを読み込めませんでした: ${error}`,
    actionFailed: error => `操作に失敗しました: ${error}`,
  },
}

const zh: GoalsMessages = {
  pane: {
    searchPlaceholder: '搜索目标…',
    newGoal: '新建目标',
    titleLabel: '标题',
    titlePlaceholder: '完成高级目标面板',
    objectiveLabel: '目标说明（可选）',
    objectivePlaceholder: '这个目标要追踪什么成果？',
    verificationLabel: '完成标准（可选）',
    verificationPlaceholder: '例如：面板正常渲染且判定提出完成建议',
    create: '创建',
    cancel: '取消',
    creating: '创建中…',
    emptyTitle: '暂无追踪目标',
    emptyDesc: '创建一个目标即可跨轮次追踪成果，完成会被检测并给出建议。',
    noMatch: query => `没有与“${query}”匹配的内容。`,
    inboxTitle: '完成建议',
    inboxDesc: '判定认为这些目标可能已完成，请逐条确认或忽略。',
    statusActive: '进行中',
    statusPaused: '已暂停',
    statusPending: '待确认',
    statusComplete: '已完成',
    statusAbandoned: '已放弃',
    confirm: '确认',
    dismiss: '忽略',
    complete: '完成',
    abandon: '放弃',
    pause: '暂停',
    resume: '继续',
    reopen: '重新打开',
    dispatch: '派发到看板',
    dispatched: taskId => `已关联看板任务 ${taskId}`,
    evidenceLabel: '依据',
    historyLabel: '历史',
    premiumTitle: '目标为高级功能',
    premiumDesc: '带智能完成检测的目标追踪仅限付费方案。',
    viewPlans: '查看方案',
    loadFailed: error => `无法加载目标：${error}`,
    actionFailed: error => `操作失败：${error}`,
  },
}

const zhHant: GoalsMessages = {
  pane: {
    searchPlaceholder: '搜尋目標…',
    newGoal: '新增目標',
    titleLabel: '標題',
    titlePlaceholder: '完成進階目標面板',
    objectiveLabel: '目標說明（選填）',
    objectivePlaceholder: '這個目標要追蹤什麼成果？',
    verificationLabel: '完成標準（選填）',
    verificationPlaceholder: '例如：面板正常渲染且判定提出完成建議',
    create: '建立',
    cancel: '取消',
    creating: '建立中…',
    emptyTitle: '尚無追蹤目標',
    emptyDesc: '建立一個目標即可跨輪次追蹤成果，完成會被偵測並提出建議。',
    noMatch: query => `沒有與「${query}」相符的內容。`,
    inboxTitle: '完成建議',
    inboxDesc: '判定認為這些目標可能已完成，請逐條確認或忽略。',
    statusActive: '進行中',
    statusPaused: '已暫停',
    statusPending: '待確認',
    statusComplete: '已完成',
    statusAbandoned: '已放棄',
    confirm: '確認',
    dismiss: '忽略',
    complete: '完成',
    abandon: '放棄',
    pause: '暫停',
    resume: '繼續',
    reopen: '重新開啟',
    dispatch: '派發到看板',
    dispatched: taskId => `已關聯看板任務 ${taskId}`,
    evidenceLabel: '依據',
    historyLabel: '歷史',
    premiumTitle: '目標為進階功能',
    premiumDesc: '具備智慧完成偵測的目標追蹤僅限付費方案。',
    viewPlans: '查看方案',
    loadFailed: error => `無法載入目標：${error}`,
    actionFailed: error => `操作失敗：${error}`,
  },
}

export const GOALS_LOCALES: PluginLocaleBundles = { en, ja, zh, 'zh-hant': zhHant }

type Bound<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : T[K] extends object
      ? Bound<T[K]>
      : string
}

export type GoalsText = Bound<GoalsMessages>

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

/** The Goals strings for the active locale — one hook every component reads. */
export function useGoals(): GoalsText {
  const t = usePluginI18n('minerva-goals')

  return useMemo(() => bind(t, en), [t])
}

/** Resolve a dotted path against the English bundle — the floor for a read
 *  that beats `ctx.i18n` into existence, so an unresolved key never ships as
 *  the literal `goals.pane.newGoal`. */
function english(key: string, ...args: unknown[]): string {
  const leaf = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], en)

  return typeof leaf === 'function' ? (leaf as (...a: unknown[]) => string)(...args) : String(leaf ?? key)
}

let bound: { text: GoalsText; translate: PluginTranslate } | null = null

/** `useGoals` for the module-level functions a hook can't reach. Non-reactive
 *  on its own; every caller is invoked during a render that a core `useI18n()`
 *  already subscribes to, so a locale switch still repaints. Cached on
 *  translator identity: `bind` walks the whole tree, and these run per row. */
export function goalsText(): GoalsText {
  const translate = getPluginCtx()?.i18n?.t ?? english

  if (bound?.translate !== translate) {
    bound = { text: bind(translate, en), translate }
  }

  return bound.text
}
