/**
 * Plugin-scoped i18n for LEADS — bundles registered under the plugin id via
 * `ctx.i18n.register`, never touching core `en.ts`. Mirrors the goals shape:
 * `useLeads()` binds the message SHAPE so components keep typed access.
 *
 * Only strings LEADS OWNS live here. Generic verbs resolve against core via
 * `useI18n()`. Locales follow the established fallback chain (active locale
 * → this plugin's `en` → the key).
 */

import { type PluginLocaleBundles, type PluginTranslate, usePluginI18n } from '@hermes/plugin-sdk'
import { useMemo } from 'react'

import { getPluginCtx } from './shared'

export type LeadsMessages = {
  pane: {
    searchPlaceholder: string
    allChannels: string
    mutedTitle: string
    emptyTitle: string
    emptyDesc: string
    noMatch: (query: string) => string
    backToList: string
    replyLabel: string
    replyPlaceholder: string
    send: string
    sending: string
    replySent: string
    confirmSend: (name: string) => string
    mute: string
    unmute: string
    pin: string
    unpin: string
    editNote: string
    notePlaceholder: string
    saveNote: string
    cancel: string
    channelsLabel: string
    emailsLabel: string
    phonesLabel: string
    noteLabel: string
    alsoOnLabel: string
    merge: string
    mergeTitle: string
    mergeHere: string
    unmerge: string
    mergedFromLabel: string
    intakeTitle: string
    groupReadOnly: string
    formNoChat: string
    sendingAs: (platform: string) => string
    premiumTitle: string
    premiumDesc: string
    viewPlans: string
    loadFailed: (error: string) => string
    actionFailed: (error: string) => string
  }
}

const en: LeadsMessages = {
  pane: {
    searchPlaceholder: 'Search contacts…',
    allChannels: 'All channels',
    mutedTitle: 'Muted',
    emptyTitle: 'No contacts yet',
    emptyDesc: 'Humans you talk to on connected channels appear here — message someone or wait for the next inbound.',
    noMatch: query => `Nothing matches “${query}”.`,
    backToList: 'Back',
    replyLabel: 'Reply',
    replyPlaceholder: 'Type a reply…',
    send: 'Send',
    sending: 'Sending…',
    replySent: 'Sent.',
    confirmSend: name => `Send this reply to ${name}?`,
    mute: 'Mute',
    unmute: 'Unmute',
    pin: 'Pin',
    unpin: 'Unpin',
    editNote: 'Note',
    notePlaceholder: 'Remember about this contact…',
    saveNote: 'Save',
    cancel: 'Cancel',
    channelsLabel: 'Channels',
    emailsLabel: 'Email',
    phonesLabel: 'Phone',
    noteLabel: 'Note',
    alsoOnLabel: 'Also on',
    merge: 'Merge',
    mergeTitle: 'Merge into…',
    mergeHere: 'Merge here',
    unmerge: 'Unmerge',
    mergedFromLabel: 'Merged',
    intakeTitle: 'Form submissions',
    groupReadOnly: 'Group chats are read-only in this version.',
    formNoChat: 'Form leads have no chat channel — reply by email.',
    sendingAs: platform => `Sends as your connected ${platform} account.`,
    premiumTitle: 'LEADS is a premium surface',
    premiumDesc: 'The human inbox across channels lives on paid plans.',
    viewPlans: 'View plans',
    loadFailed: error => `Couldn’t load contacts: ${error}`,
    actionFailed: error => `Action failed: ${error}`,
  },
}

const ja: LeadsMessages = {
  pane: {
    searchPlaceholder: '連絡先を検索…',
    allChannels: '全チャンネル',
    mutedTitle: 'ミュート中',
    emptyTitle: '連絡先はまだありません',
    emptyDesc: '接続中のチャンネルで会話した相手がここに表示されます。',
    noMatch: query => `「${query}」に一致するものがありません。`,
    backToList: '戻る',
    replyLabel: '返信',
    replyPlaceholder: '返信を入力…',
    send: '送信',
    sending: '送信中…',
    replySent: '送信しました。',
    confirmSend: name => `${name}にこの返信を送りますか？`,
    mute: 'ミュート',
    unmute: 'ミュート解除',
    pin: 'ピン留め',
    unpin: 'ピン解除',
    editNote: 'メモ',
    notePlaceholder: 'この連絡先についてのメモ…',
    saveNote: '保存',
    cancel: 'キャンセル',
    channelsLabel: 'チャンネル',
    emailsLabel: 'メール',
    phonesLabel: '電話',
    noteLabel: 'メモ',
    alsoOnLabel: '他チャンネルにも',
    merge: '統合',
    mergeTitle: '統合先…',
    mergeHere: 'ここに統合',
    unmerge: '統合解除',
    mergedFromLabel: '統合元',
    intakeTitle: 'フォーム送信',
    groupReadOnly: 'グループチャットはこのバージョンでは読み取り専用です。',
    formNoChat: 'フォームのリードにはチャットがありません。メールで返信してください。',
    sendingAs: platform => `接続中の${platform}アカウントとして送信します。`,
    premiumTitle: 'LEADSはプレミアム機能です',
    premiumDesc: 'チャンネル横断の受信箱は有料プランで利用できます。',
    viewPlans: 'プランを見る',
    loadFailed: error => `連絡先を読み込めませんでした: ${error}`,
    actionFailed: error => `操作に失敗しました: ${error}`,
  },
}

const zh: LeadsMessages = {
  pane: {
    searchPlaceholder: '搜索联系人…',
    allChannels: '全部渠道',
    mutedTitle: '已静音',
    emptyTitle: '还没有联系人',
    emptyDesc: '在已连接渠道上交谈过的人会出现在这里。',
    noMatch: query => `没有匹配「${query}」的内容。`,
    backToList: '返回',
    replyLabel: '回复',
    replyPlaceholder: '输入回复…',
    send: '发送',
    sending: '发送中…',
    replySent: '已发送。',
    confirmSend: name => `将此回复发送给${name}吗？`,
    mute: '静音',
    unmute: '取消静音',
    pin: '置顶',
    unpin: '取消置顶',
    editNote: '备注',
    notePlaceholder: '记下关于此联系人的事…',
    saveNote: '保存',
    cancel: '取消',
    channelsLabel: '渠道',
    emailsLabel: '邮箱',
    phonesLabel: '电话',
    noteLabel: '备注',
    alsoOnLabel: '同时在',
    merge: '合并',
    mergeTitle: '合并到…',
    mergeHere: '合并到此',
    unmerge: '取消合并',
    mergedFromLabel: '已合并',
    intakeTitle: '表单提交',
    groupReadOnly: '群聊在此版本中为只读。',
    formNoChat: '表单线索没有聊天通道，请通过邮件回复。',
    sendingAs: platform => `将以你连接的 ${platform} 账号发送。`,
    premiumTitle: 'LEADS 是高级功能',
    premiumDesc: '跨渠道的联系人收件箱仅适用于付费方案。',
    viewPlans: '查看方案',
    loadFailed: error => `无法加载联系人：${error}`,
    actionFailed: error => `操作失败：${error}`,
  },
}

const zhHant: LeadsMessages = {
  pane: {
    searchPlaceholder: '搜尋聯絡人…',
    allChannels: '全部渠道',
    mutedTitle: '已靜音',
    emptyTitle: '還沒有聯絡人',
    emptyDesc: '在已連接渠道上交談過的人會出現在這裡。',
    noMatch: query => `沒有符合「${query}」的內容。`,
    backToList: '返回',
    replyLabel: '回覆',
    replyPlaceholder: '輸入回覆…',
    send: '傳送',
    sending: '傳送中…',
    replySent: '已傳送。',
    confirmSend: name => `要將此回覆傳送給${name}嗎？`,
    mute: '靜音',
    unmute: '取消靜音',
    pin: '置頂',
    unpin: '取消置頂',
    editNote: '備註',
    notePlaceholder: '記下關於此聯絡人的事…',
    saveNote: '儲存',
    cancel: '取消',
    channelsLabel: '渠道',
    emailsLabel: '電郵',
    phonesLabel: '電話',
    noteLabel: '備註',
    alsoOnLabel: '同時在',
    merge: '合併',
    mergeTitle: '合併到…',
    mergeHere: '合併到此',
    unmerge: '取消合併',
    mergedFromLabel: '已合併',
    intakeTitle: '表單提交',
    groupReadOnly: '群組聊天在此版本中為唯讀。',
    formNoChat: '表單線索沒有聊天通道，請透過電郵回覆。',
    sendingAs: platform => `將以你連接的 ${platform} 帳號傳送。`,
    premiumTitle: 'LEADS 是進階功能',
    premiumDesc: '跨渠道的聯絡人收件箱僅適用於付費方案。',
    viewPlans: '查看方案',
    loadFailed: error => `無法載入聯絡人：${error}`,
    actionFailed: error => `操作失敗：${error}`,
  },
}

export const LEADS_LOCALES: PluginLocaleBundles = { en, ja, zh, 'zh-hant': zhHant }

type Bound<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : T[K] extends object
      ? Bound<T[K]>
      : string
}

export type LeadsText = Bound<LeadsMessages>

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

/** The LEADS strings for the active locale — one hook every component reads. */
export function useLeads(): LeadsText {
  const t = usePluginI18n('minerva-leads')

  return useMemo(() => bind(t, en), [t])
}

/** Resolve a dotted path against the English bundle — the floor for a read
 *  that beats `ctx.i18n` into existence, so an unresolved key never ships as
 *  the literal `leads.pane.send`. */
function english(key: string, ...args: unknown[]): string {
  const leaf = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], en)

  return typeof leaf === 'function' ? (leaf as (...a: unknown[]) => string)(...args) : String(leaf ?? key)
}

let bound: { text: LeadsText; translate: PluginTranslate } | null = null

/** `useLeads` for the module-level functions a hook can't reach. Non-reactive
 *  on its own; every caller is invoked during a render that a core `useI18n()`
 *  already subscribes to, so a locale switch still repaints. Cached on
 *  translator identity: `bind` walks the whole tree, and these run per row. */
export function leadsText(): LeadsText {
  const translate = getPluginCtx()?.i18n?.t ?? english

  if (bound?.translate !== translate) {
    bound = { text: bind(translate, en), translate }
  }

  return bound.text
}
