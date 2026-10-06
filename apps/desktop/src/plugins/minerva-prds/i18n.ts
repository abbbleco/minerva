/**
 * Plugin-scoped i18n for PRDs — bundles registered under the plugin id via
 * `ctx.i18n.register`, never touching core `en.ts`. Mirrors the goals shape:
 * `usePrds()` binds the message SHAPE so components keep typed access.
 *
 * Only strings PRDs OWNS live here. Generic verbs resolve against core via
 * `useI18n()`. Locales follow the established fallback chain (active locale
 * → this plugin's `en` → the key).
 */

import { type PluginLocaleBundles, type PluginTranslate, usePluginI18n } from '@hermes/plugin-sdk'
import { useMemo } from 'react'

import { getPluginCtx } from './shared'

export type PrdsMessages = {
  pane: {
    searchPlaceholder: string
    newIntake: string
    intakeLabel: string
    intakePlaceholder: string
    inject: string
    injecting: string
    emptyTitle: string
    emptyDesc: string
    noMatch: (query: string) => string
    reviewTitle: string
    reviewDesc: string
    watchingTitle: string
    watchingDesc: string
    historyTitle: string
    statusDraft: string
    statusInReview: string
    statusApproved: string
    statusRejected: string
    statusWatch: string
    statusDismissed: string
    problemLabel: string
    usersLabel: string
    requirementsLabel: string
    acceptanceLabel: string
    questionsLabel: string
    sourcesLabel: string
    conversationLabel: string
    startReview: string
    approve: string
    reject: string
    revise: string
    dispatch: string
    dispatched: (taskId: string) => string
    rejectReasonLabel: string
    rejectReasonPlaceholder: string
    reviseFieldLabel: string
    reviseValueLabel: string
    save: string
    cancel: string
    premiumTitle: string
    premiumDesc: string
    viewPlans: string
    loadFailed: (error: string) => string
    actionFailed: (error: string) => string
  }
}

const en: PrdsMessages = {
  pane: {
    searchPlaceholder: 'Search PRDs…',
    newIntake: 'Add intake',
    intakeLabel: 'Paste a conversation',
    intakePlaceholder: 'Paste the feature discussion to triage…',
    inject: 'Submit',
    injecting: 'Submitting…',
    emptyTitle: 'No PRDs yet',
    emptyDesc: 'The pipeline drafts PRDs from conversations — review them here.',
    noMatch: query => `Nothing matches “${query}”.`,
    reviewTitle: 'Needs review',
    reviewDesc: 'Drafts from triage. Approve, edit, or reject each.',
    watchingTitle: 'Watching',
    watchingDesc: 'Conversations waiting for more context.',
    historyTitle: 'History',
    statusDraft: 'Draft',
    statusInReview: 'In review',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',
    statusWatch: 'Watching',
    statusDismissed: 'Dismissed',
    problemLabel: 'Problem',
    usersLabel: 'Users',
    requirementsLabel: 'Requirements',
    acceptanceLabel: 'Acceptance criteria',
    questionsLabel: 'Open questions',
    sourcesLabel: 'Sources',
    conversationLabel: 'Conversation',
    startReview: 'Start review',
    approve: 'Approve',
    reject: 'Reject',
    revise: 'Edit',
    dispatch: 'Dispatch to kanban',
    dispatched: taskId => `Linked kanban task ${taskId}`,
    rejectReasonLabel: 'Rejection reason',
    rejectReasonPlaceholder: 'e.g. out of scope for now',
    reviseFieldLabel: 'Section',
    reviseValueLabel: 'Content (one item per line for lists)',
    save: 'Save',
    cancel: 'Cancel',
    premiumTitle: 'PRDs is a premium surface',
    premiumDesc: 'The intake-to-review PRD pipeline lives on paid plans.',
    viewPlans: 'View plans',
    loadFailed: error => `Couldn’t load PRDs: ${error}`,
    actionFailed: error => `Action failed: ${error}`,
  },
}

const ja: PrdsMessages = {
  pane: {
    searchPlaceholder: 'PRDを検索…',
    newIntake: '取り込みを追加',
    intakeLabel: '会話の貼り付け',
    intakePlaceholder: 'トリアージする機能の会話を貼り付け…',
    inject: '取り込む',
    injecting: '取り込み中…',
    emptyTitle: 'PRDはまだありません',
    emptyDesc: 'パイプラインが会話からPRDを起草します。ここでレビューしてください。',
    noMatch: query => `「${query}」に一致するものがありません。`,
    reviewTitle: 'レビュー待ち',
    reviewDesc: 'トリアージが起草したPRDです。承認・編集・却下してください。',
    watchingTitle: '経過観察中',
    watchingDesc: '文脈が集まるのを待っている会話です。',
    historyTitle: '履歴',
    statusDraft: '下書き',
    statusInReview: 'レビュー中',
    statusApproved: '承認済み',
    statusRejected: '却下',
    statusWatch: '観察中',
    statusDismissed: '破棄',
    problemLabel: '課題',
    usersLabel: 'ユーザー',
    requirementsLabel: '要件',
    acceptanceLabel: '受け入れ条件',
    questionsLabel: '未解決の質問',
    sourcesLabel: '出典',
    conversationLabel: '会話',
    startReview: 'レビュー開始',
    approve: '承認',
    reject: '却下',
    revise: '編集',
    dispatch: 'kanbanに送る',
    dispatched: taskId => `kanbanタスク ${taskId} に連携済み`,
    rejectReasonLabel: '却下の理由',
    rejectReasonPlaceholder: '例: 現時点ではスコープ外',
    reviseFieldLabel: '項目',
    reviseValueLabel: '内容（リストは1行1項目）',
    save: '保存',
    cancel: 'キャンセル',
    premiumTitle: 'PRDはプレミアム機能です',
    premiumDesc: '取り込みから起草・レビューまでのPRDパイプラインは有料プランで利用できます。',
    viewPlans: 'プランを見る',
    loadFailed: error => `PRDを読み込めませんでした: ${error}`,
    actionFailed: error => `操作に失敗しました: ${error}`,
  },
}

const zh: PrdsMessages = {
  pane: {
    searchPlaceholder: '搜索 PRD…',
    newIntake: '添加 intake',
    intakeLabel: '粘贴对话',
    intakePlaceholder: '粘贴要分诊的功能讨论…',
    inject: '提交',
    injecting: '提交中…',
    emptyTitle: '还没有 PRD',
    emptyDesc: '管道会从对话自动起草 PRD，在此评审。',
    noMatch: query => `没有匹配「${query}」的内容。`,
    reviewTitle: '待评审',
    reviewDesc: '分诊起草的 PRD，请批准、编辑或拒绝。',
    watchingTitle: '观察中',
    watchingDesc: '等待更多上下文的对话。',
    historyTitle: '历史',
    statusDraft: '草稿',
    statusInReview: '评审中',
    statusApproved: '已批准',
    statusRejected: '已拒绝',
    statusWatch: '观察中',
    statusDismissed: '已忽略',
    problemLabel: '问题',
    usersLabel: '用户',
    requirementsLabel: '需求',
    acceptanceLabel: '验收标准',
    questionsLabel: '待解决问题',
    sourcesLabel: '来源',
    conversationLabel: '对话',
    startReview: '开始评审',
    approve: '批准',
    reject: '拒绝',
    revise: '编辑',
    dispatch: '派发到 kanban',
    dispatched: taskId => `已关联 kanban 任务 ${taskId}`,
    rejectReasonLabel: '拒绝原因',
    rejectReasonPlaceholder: '例如：目前超出范围',
    reviseFieldLabel: '字段',
    reviseValueLabel: '内容（列表每行一项）',
    save: '保存',
    cancel: '取消',
    premiumTitle: 'PRD 是高级功能',
    premiumDesc: '从 intake 到起草评审的 PRD 管道仅适用于付费方案。',
    viewPlans: '查看方案',
    loadFailed: error => `无法加载 PRD：${error}`,
    actionFailed: error => `操作失败：${error}`,
  },
}

const zhHant: PrdsMessages = {
  pane: {
    searchPlaceholder: '搜尋 PRD…',
    newIntake: '新增 intake',
    intakeLabel: '貼上對話',
    intakePlaceholder: '貼上要分診的功能討論…',
    inject: '送出',
    injecting: '送出中…',
    emptyTitle: '還沒有 PRD',
    emptyDesc: '管道會從對話自動起草 PRD，在此審核。',
    noMatch: query => `沒有符合「${query}」的內容。`,
    reviewTitle: '待審核',
    reviewDesc: '分診起草的 PRD，請批准、編輯或拒絕。',
    watchingTitle: '觀察中',
    watchingDesc: '等待更多上下文的對話。',
    historyTitle: '歷史',
    statusDraft: '草稿',
    statusInReview: '審核中',
    statusApproved: '已批准',
    statusRejected: '已拒絕',
    statusWatch: '觀察中',
    statusDismissed: '已忽略',
    problemLabel: '問題',
    usersLabel: '使用者',
    requirementsLabel: '需求',
    acceptanceLabel: '驗收標準',
    questionsLabel: '待解決問題',
    sourcesLabel: '來源',
    conversationLabel: '對話',
    startReview: '開始審核',
    approve: '批准',
    reject: '拒絕',
    revise: '編輯',
    dispatch: '派發到 kanban',
    dispatched: taskId => `已連結 kanban 任務 ${taskId}`,
    rejectReasonLabel: '拒絕原因',
    rejectReasonPlaceholder: '例如：目前超出範圍',
    reviseFieldLabel: '欄位',
    reviseValueLabel: '內容（清單每行一項）',
    save: '儲存',
    cancel: '取消',
    premiumTitle: 'PRD 是進階功能',
    premiumDesc: '從 intake 到起草審核的 PRD 管道僅適用於付費方案。',
    viewPlans: '查看方案',
    loadFailed: error => `無法載入 PRD：${error}`,
    actionFailed: error => `操作失敗：${error}`,
  },
}

export const PRDS_LOCALES: PluginLocaleBundles = { en, ja, zh, 'zh-hant': zhHant }

type Bound<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : T[K] extends object
      ? Bound<T[K]>
      : string
}

export type PrdsText = Bound<PrdsMessages>

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

/** The PRDs strings for the active locale — one hook every component reads. */
export function usePrds(): PrdsText {
  const t = usePluginI18n('minerva-prds')

  return useMemo(() => bind(t, en), [t])
}

/** Resolve a dotted path against the English bundle — the floor for a read
 *  that beats `ctx.i18n` into existence, so an unresolved key never ships as
 *  the literal `prds.pane.newIntake`. */
function english(key: string, ...args: unknown[]): string {
  const leaf = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], en)

  return typeof leaf === 'function' ? (leaf as (...a: unknown[]) => string)(...args) : String(leaf ?? key)
}

let bound: { text: PrdsText; translate: PluginTranslate } | null = null

/** `usePrds` for the module-level functions a hook can't reach. Non-reactive
 *  on its own; every caller is invoked during a render that a core `useI18n()`
 *  already subscribes to, so a locale switch still repaints. Cached on
 *  translator identity: `bind` walks the whole tree, and these run per row. */
export function prdsText(): PrdsText {
  const translate = getPluginCtx()?.i18n?.t ?? english

  if (bound?.translate !== translate) {
    bound = { text: bind(translate, en), translate }
  }

  return bound.text
}
