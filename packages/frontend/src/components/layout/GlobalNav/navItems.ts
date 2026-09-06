import { House, UserRound, type LucideIcon } from '@lucide/vue';
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

/**
 * シェルのナビ項目（v0.4.dc.html の navItems と同じ2つ）。
 *
 * 卓の一覧はダッシュボードに統合済みなので、独立した「卓」項目は置かない
 * （router の `/lobbies` → dashboard リダイレクトを参照）。
 */
export const GLOBAL_NAV_ITEMS: readonly GlobalNavItem[] = [
  {
    id: 'dashboard',
    label: 'ダッシュボード',
    icon: House,
    to: { name: 'dashboard' },
    matches: [
      'dashboard',
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
