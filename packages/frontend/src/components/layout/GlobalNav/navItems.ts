import { House, LayoutGrid, UserRound, type LucideIcon } from '@lucide/vue';
import type { RouteLocationRaw } from 'vue-router';

export type GlobalNavItem = {
  /** 一意なキー。v-for と現在地判定に使う */
  id: string;
  label: string;
  icon: LucideIcon;
  to: RouteLocationRaw;
  /**
   * この項目を現在地として扱うルート名。
   * 卓（ロビー・開催）配下はダッシュボードの下位ページなのでまとめて拾う。
   */
  matches: readonly string[];
};

/** シェルのナビ項目。 */
export const GLOBAL_NAV_ITEMS: readonly GlobalNavItem[] = [
  {
    id: 'dashboard',
    label: 'ダッシュボード',
    icon: House,
    to: { name: 'dashboard' },
    matches: ['dashboard'],
  },
  {
    id: 'tables',
    label: '卓',
    icon: LayoutGrid,
    to: { name: 'tables' },
    // 卓の下位ページ（ロビー・開催の各画面）はまとめて「卓」を現在地にする
    matches: [
      'tables',
      'lobbies-new',
      'lobbies-edit',
      'lobbies-detail',
      'game-sessions-edit',
      'game-sessions-detail',
      'game-sessions-play-memo',
    ],
  },
  {
    id: 'profile',
    label: 'マイページ',
    icon: UserRound,
    to: { name: 'profile-setting' },
    matches: ['profile-setting'],
  },
];
