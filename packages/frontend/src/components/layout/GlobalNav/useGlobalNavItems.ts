import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import {
  GLOBAL_NAV_ITEMS,
  type GlobalNavItem,
} from '@/components/layout/GlobalNav/navItems';

export type GlobalNavItemView = GlobalNavItem & {
  isCurrent: boolean;
  /** 現在地のときだけ付ける。template に三項演算子を書かないためここで解決する */
  ariaCurrent: 'page' | undefined;
};

/**
 * ナビ項目に現在地フラグを載せた表示用データを返す。
 *
 * デスクトップのヘッダーとモバイルの下部タブが同じ判定を共有するため、
 * 判定はここ1か所に集約している。
 */
export const useGlobalNavItems = (
  currentRouteName: MaybeRefOrGetter<string | null | undefined>,
) => {
  const items = computed<GlobalNavItemView[]>(() => {
    const name = toValue(currentRouteName);
    return GLOBAL_NAV_ITEMS.map((item) => {
      const isCurrent = name != null && item.matches.includes(name);
      return {
        ...item,
        isCurrent,
        ariaCurrent: isCurrent ? ('page' as const) : undefined,
      };
    });
  });

  return { items };
};
