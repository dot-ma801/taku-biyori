/**
 * 画面（ルート）の名前。
 *
 * `router/index.ts` の `name` と、ルート名を参照する側（ナビの現在地判定など）の
 * **唯一の出典**。文字列リテラルを直接書くと綴り違いに気づけないため、
 * ルート名を扱うところはすべてここを経由する。
 *
 * ルートを増やしたら、まずここに足してから `router/index.ts` で使うこと。
 */
export const PAGE_NAME = {
  top: 'top',
  login: 'login',
  authCallback: 'auth-callback',
  dashboard: 'dashboard',
  profileSetting: 'profile-setting',
  lobbiesNew: 'lobbies-new',
  lobbiesEdit: 'lobbies-edit',
  lobbiesDetail: 'lobbies-detail',
  gameSessionsEdit: 'game-sessions-edit',
  gameSessionsDetail: 'game-sessions-detail',
  gameSessionsPlayMemo: 'game-sessions-play-memo',
} as const;

export type PageName = (typeof PAGE_NAME)[keyof typeof PAGE_NAME];

const PAGE_NAMES: readonly string[] = Object.values(PAGE_NAME);

/**
 * 文字列が既知の画面名か。
 *
 * `route.name` は `string | symbol | undefined` を取りうるので、
 * 判定に使う前にここで `PageName` へ絞り込む。
 */
export const isPageName = (value: unknown): value is PageName =>
  typeof value === 'string' && PAGE_NAMES.includes(value);
