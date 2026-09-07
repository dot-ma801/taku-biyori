import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  GLOBAL_NAV_ITEMS,
  type GlobalNavItem,
} from '@/components/layout/GlobalNav/navItems';
import { isPageName, type PageName } from '@/config/pageName';

export type GlobalNavItemView = GlobalNavItem & {
  isCurrent: boolean;
  /** 現在地のときだけ付ける。template に三項演算子を書かないためここで解決する */
  ariaCurrent: 'page' | undefined;
};

/**
 * ナビ項目に現在地フラグを載せる。**導出はこの純関数に集約する。**
 *
 * `useRoute()` に触れないので、テストは画面名を渡すだけで書ける。
 */
export const toGlobalNavItemViews = (
  currentPage: PageName | null,
): GlobalNavItemView[] =>
  GLOBAL_NAV_ITEMS.map((item) => {
    const isCurrent =
      currentPage !== null && item.matches.includes(currentPage);
    return {
      ...item,
      isCurrent,
      ariaCurrent: isCurrent ? ('page' as const) : undefined,
    };
  });

/**
 * シェルのナビ項目を、現在地フラグ付きで返す。
 *
 * デスクトップのヘッダーとモバイルの下部タブが同じ判定を共有するため、
 * **現在地の取得と正規化もここに閉じる**。呼び出し側は引数なしで使い、
 * `route.name` の型（`string | symbol | undefined`）を意識しない。
 */
export const useGlobalNavItems = () => {
  const route = useRoute();

  // route.name は symbol も undefined も取りうる。既知の画面名だけに絞り込む
  const currentPage = computed<PageName | null>(() =>
    isPageName(route.name) ? route.name : null,
  );

  const items = computed(() => toGlobalNavItemViews(currentPage.value));

  return { items };
};
