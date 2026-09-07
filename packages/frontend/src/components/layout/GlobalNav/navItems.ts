import { House, LayoutGrid, UserRound, type LucideIcon } from '@lucide/vue';
import type { RouteLocationRaw } from 'vue-router';
import { PAGE_NAME, type PageName } from '@/config/pageName';

export type GlobalNavItem = {
  /** 一意なキー。v-for と現在地判定に使う */
  id: string;
  label: string;
  icon: LucideIcon;
  to: RouteLocationRaw;
  /**
   * この項目を現在地として扱う画面。
   * 卓（ロビー・開催）配下はダッシュボードの下位ページなのでまとめて拾う。
   *
   * `PageName` に絞ってあるので、存在しない画面名を書くと型で落ちる。
   */
  matches: readonly PageName[];
};

/** シェルのナビ項目。 */
export const GLOBAL_NAV_ITEMS: readonly GlobalNavItem[] = [
  {
    id: 'dashboard',
    label: 'ダッシュボード',
    icon: House,
    to: { name: PAGE_NAME.dashboard },
    matches: [PAGE_NAME.dashboard],
  },
  {
    id: 'game-sessions',
    label: '卓',
    icon: LayoutGrid,
    to: { name: PAGE_NAME.gameSessions },
    // 卓の下位ページ（ロビー・開催の各画面）はまとめて「卓」を現在地にする
    matches: [
      PAGE_NAME.gameSessions,
      PAGE_NAME.lobbiesNew,
      PAGE_NAME.lobbiesEdit,
      PAGE_NAME.lobbiesDetail,
      PAGE_NAME.gameSessionsEdit,
      PAGE_NAME.gameSessionsDetail,
      PAGE_NAME.gameSessionsPlayMemo,
    ],
  },
  {
    id: 'profile',
    label: 'マイページ',
    icon: UserRound,
    to: { name: PAGE_NAME.profileSetting },
    matches: [PAGE_NAME.profileSetting],
  },
];
