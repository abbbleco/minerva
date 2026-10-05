/**
 * Plugin-scoped i18n for Feeds — bundles registered under the plugin id via
 * `ctx.i18n.register`, never touching core `en.ts`. Mirrors the kanban/bots
 * shape: `useFeeds()` binds the message SHAPE so components keep typed access.
 *
 * Only strings Feeds OWNS live here. Generic verbs resolve against core via
 * `useI18n()`. Locales follow the established fallback chain (active locale
 * → this plugin's `en` → the key).
 */

import { type PluginLocaleBundles, type PluginTranslate, usePluginI18n } from '@hermes/plugin-sdk'
import { useMemo } from 'react'

import { getPluginCtx } from './shared'

export type FeedsMessages = {
  pane: {
    searchPlaceholder: string
    refresh: string
    refreshing: string
    markRead: string
    markUnread: string
    openOriginal: string
    saveToSession: string
    emptyTitle: string
    emptyDesc: string
    noMatch: (query: string) => string
    unreadOnly: string
    manageSources: string
    doneManaging: string
    addSource: string
    sourceName: string
    sourceNamePlaceholder: string
    sourceUrl: string
    sourceUrlPlaceholder: string
    providerRss: string
    providerFacebook: string
    providerInstagram: string
    intervalMinutes: string
    enable: string
    disable: string
    remove: string
    removeConfirm: (name: string) => string
    connect: string
    connecting: string
    disconnect: string
    connected: string
    needsReconnect: string
    tokenPlaceholder: string
    tokenHelpFacebook: string
    tokenHelpInstagram: string
    lastPolledNever: string
    pollFailed: (error: string) => string
    premiumTitle: string
    premiumDesc: string
    viewPlans: string
  }
}

const en: FeedsMessages = {
  pane: {
    searchPlaceholder: 'Search items…',
    refresh: 'Refresh',
    refreshing: 'Refreshing…',
    markRead: 'Mark read',
    markUnread: 'Mark unread',
    openOriginal: 'Open original',
    saveToSession: 'Save to session',
    emptyTitle: 'No feed items yet',
    emptyDesc: 'Add a source below, then refresh to pull the latest.',
    noMatch: query => `Nothing matches “${query}”.`,
    unreadOnly: 'Unread only',
    manageSources: 'Manage sources',
    doneManaging: 'Done',
    addSource: 'Add source',
    sourceName: 'Name',
    sourceNamePlaceholder: 'My feed',
    sourceUrl: 'Feed URL',
    sourceUrlPlaceholder: 'https://example.com/feed.xml',
    providerRss: 'RSS / Atom',
    providerFacebook: 'Facebook',
    providerInstagram: 'Instagram',
    intervalMinutes: 'Check every (minutes)',
    enable: 'Enable',
    disable: 'Disable',
    remove: 'Remove',
    removeConfirm: name => `Remove “${name}” and its items?`,
    connect: 'Connect',
    connecting: 'Connecting…',
    disconnect: 'Disconnect',
    connected: 'Connected',
    needsReconnect: 'Needs reconnect',
    tokenPlaceholder: 'Paste your access token',
    tokenHelpFacebook: 'Create a token with user_posts access in the Meta developer dashboard, then paste it here. It is stored in this profile only.',
    tokenHelpInstagram: 'Connect an Instagram Business or Creator account linked to a Facebook Page: create a token in the Meta developer dashboard, then paste it here. It is stored in this profile only.',
    lastPolledNever: 'Never polled',
    pollFailed: error => `Poll failed: ${error}`,
    premiumTitle: 'Feeds is a premium surface',
    premiumDesc: 'Curated feeds with briefs live on paid plans.',
    viewPlans: 'View plans',
  },
}

const ja: FeedsMessages = {
  pane: {
    searchPlaceholder: 'アイテムを検索…',
    refresh: '更新',
    refreshing: '更新中…',
    markRead: '既読にする',
    markUnread: '未読にする',
    openOriginal: '元記事を開く',
    saveToSession: 'セッションに保存',
    emptyTitle: 'アイテムがありません',
    emptyDesc: 'ソースを追加して更新してください。',
    noMatch: query => `「${query}」に一致するものがありません。`,
    unreadOnly: '未読のみ',
    manageSources: 'ソース管理',
    doneManaging: '完了',
    addSource: 'ソース追加',
    sourceName: '名前',
    sourceNamePlaceholder: 'マイフィード',
    sourceUrl: 'フィードURL',
    sourceUrlPlaceholder: 'https://example.com/feed.xml',
    providerRss: 'RSS / Atom',
    providerFacebook: 'Facebook',
    providerInstagram: 'Instagram',
    intervalMinutes: '確認間隔（分）',
    enable: '有効',
    disable: '無効',
    remove: '削除',
    removeConfirm: name => `「${name}」とそのアイテムを削除しますか?`,
    connect: '接続',
    connecting: '接続中…',
    disconnect: '切断',
    connected: '接続済み',
    needsReconnect: '再接続が必要',
    tokenPlaceholder: 'アクセストークンを貼り付け',
    tokenHelpFacebook: 'Meta開発者ダッシュボードでトークンを作成し、ここに貼り付けてください。このプロファイルにのみ保存されます。',
    tokenHelpInstagram: 'FacebookページにリンクされたInstagramビジネス／クリエイターアカウントを接続します。Meta開発者ダッシュボードでトークンを作成し、ここに貼り付けてください。このプロファイルにのみ保存されます。',
    lastPolledNever: '未取得',
    pollFailed: error => `取得に失敗: ${error}`,
    premiumTitle: 'フィードはプレミアム機能です',
    premiumDesc: '要約付きフィードは有料プランで利用できます。',
    viewPlans: 'プランを見る',
  },
}

const zh: FeedsMessages = {
  pane: {
    searchPlaceholder: '搜索内容…',
    refresh: '刷新',
    refreshing: '刷新中…',
    markRead: '标为已读',
    markUnread: '标为未读',
    openOriginal: '打开原文',
    saveToSession: '保存到会话',
    emptyTitle: '暂无内容',
    emptyDesc: '添加来源后刷新即可获取最新内容。',
    noMatch: query => `没有与“${query}”匹配的内容。`,
    unreadOnly: '只看未读',
    manageSources: '管理来源',
    doneManaging: '完成',
    addSource: '添加来源',
    sourceName: '名称',
    sourceNamePlaceholder: '我的订阅',
    sourceUrl: '订阅地址',
    sourceUrlPlaceholder: 'https://example.com/feed.xml',
    providerRss: 'RSS / Atom',
    providerFacebook: 'Facebook',
    providerInstagram: 'Instagram',
    intervalMinutes: '检查间隔（分钟）',
    enable: '启用',
    disable: '停用',
    remove: '删除',
    removeConfirm: name => `删除“${name}”及其内容吗？`,
    connect: '连接',
    connecting: '连接中…',
    disconnect: '断开',
    connected: '已连接',
    needsReconnect: '需要重新连接',
    tokenPlaceholder: '粘贴访问令牌',
    tokenHelpFacebook: '在 Meta 开发者后台创建令牌后粘贴到此处，仅保存在此配置中。',
    tokenHelpInstagram: '连接已关联 Facebook 公共主页的 Instagram 商业／创作者账号：在 Meta 开发者后台创建令牌后粘贴到此处，仅保存在此配置中。',
    lastPolledNever: '从未获取',
    pollFailed: error => `获取失败：${error}`,
    premiumTitle: '订阅流为高级功能',
    premiumDesc: '带摘要的订阅流仅限付费方案。',
    viewPlans: '查看方案',
  },
}

const zhHant: FeedsMessages = {
  pane: {
    searchPlaceholder: '搜尋內容…',
    refresh: '重新整理',
    refreshing: '重新整理中…',
    markRead: '標為已讀',
    markUnread: '標為未讀',
    openOriginal: '開啟原文',
    saveToSession: '儲存到會話',
    emptyTitle: '暫無內容',
    emptyDesc: '新增來源後重新整理即可取得最新內容。',
    noMatch: query => `沒有與「${query}」相符的內容。`,
    unreadOnly: '只看未讀',
    manageSources: '管理來源',
    doneManaging: '完成',
    addSource: '新增來源',
    sourceName: '名稱',
    sourceNamePlaceholder: '我的訂閱',
    sourceUrl: '訂閱網址',
    sourceUrlPlaceholder: 'https://example.com/feed.xml',
    providerRss: 'RSS / Atom',
    providerFacebook: 'Facebook',
    providerInstagram: 'Instagram',
    intervalMinutes: '檢查間隔（分鐘）',
    enable: '啟用',
    disable: '停用',
    remove: '刪除',
    removeConfirm: name => `刪除「${name}」及其內容嗎？`,
    connect: '連接',
    connecting: '連接中…',
    disconnect: '中斷連線',
    connected: '已連接',
    needsReconnect: '需要重新連接',
    tokenPlaceholder: '貼上存取權杖',
    tokenHelpFacebook: '在 Meta 開發者後台建立權杖後貼到此處，僅儲存在此設定中。',
    tokenHelpInstagram: '連接已連結 Facebook 粉絲專頁的 Instagram 商業／創作者帳號：在 Meta 開發者後台建立權杖後貼到此處，僅儲存在此設定中。',
    lastPolledNever: '從未取得',
    pollFailed: error => `取得失敗：${error}`,
    premiumTitle: '訂閱為進階功能',
    premiumDesc: '附摘要的訂閱僅限付費方案。',
    viewPlans: '查看方案',
  },
}

export const FEEDS_LOCALES: PluginLocaleBundles = { en, ja, zh, 'zh-hant': zhHant }

type Bound<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : T[K] extends object
      ? Bound<T[K]>
      : string
}

export type FeedsText = Bound<FeedsMessages>

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

/** The Feeds strings for the active locale — one hook every component reads. */
export function useFeeds(): FeedsText {
  const t = usePluginI18n('minerva-feeds')

  return useMemo(() => bind(t, en), [t])
}

/** Resolve a dotted path against the English bundle — the floor for a read
 *  that beats `ctx.i18n` into existence, so an unresolved key never ships as
 *  the literal `feeds.pane.refresh`. */
function english(key: string, ...args: unknown[]): string {
  const leaf = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], en)

  return typeof leaf === 'function' ? (leaf as (...a: unknown[]) => string)(...args) : String(leaf ?? key)
}

let bound: { text: FeedsText; translate: PluginTranslate } | null = null

/** `useFeeds` for the module-level functions a hook can't reach. Non-reactive
 *  on its own; every caller is invoked during a render that a core `useI18n()`
 *  already subscribes to, so a locale switch still repaints. Cached on
 *  translator identity: `bind` walks the whole tree, and these run per row. */
export function feedsText(): FeedsText {
  const translate = getPluginCtx()?.i18n?.t ?? english

  if (bound?.translate !== translate) {
    bound = { text: bind(translate, en), translate }
  }

  return bound.text
}
