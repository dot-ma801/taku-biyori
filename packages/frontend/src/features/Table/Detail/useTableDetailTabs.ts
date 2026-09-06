import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { TabItem } from '@/components/common/BaseTabs/BaseTabs.vue';
import { TableCardStatus } from '@/features/Table/tableCardStatus';
import { TableRole } from '@/features/Table/Detail/tableRole';

/** 卓詳細のタブ */
export enum TableDetailTab {
  overview = 'overview',
  schedule = 'schedule',
  members = 'members',
  playMemo = 'playMemo',
}

const LABEL: Record<TableDetailTab, string> = {
  [TableDetailTab.overview]: '概要',
  [TableDetailTab.schedule]: '日程調整',
  [TableDetailTab.members]: 'メンバー',
  [TableDetailTab.playMemo]: 'プレイメモ',
};

/**
 * 卓詳細のタブ構成。
 *
 * 出す・出さないの規則はここ1か所に集約する。コンポーネント側は
 * `v-if` の分岐を持たない（CLAUDE.md「コンポーネントが持っていいもの」）。
 *
 * - 概要・メンバーは常に出す
 * - 日程調整は、まだ開催が決まっていない状態でだけ意味がある。開催予定・完了に
 *   なったら履歴を見る場でしかなくなるので、ホストにだけ残す
 * - プレイメモは開催が生まれてから。開催の無い卓ではタブごと出さない
 */
export const useTableDetailTabs = (
  status: MaybeRefOrGetter<TableCardStatus | null>,
  role: MaybeRefOrGetter<TableRole>,
  hasGameSession: MaybeRefOrGetter<boolean>,
) => {
  const availableTabs = computed<TableDetailTab[]>(() => {
    const currentStatus = toValue(status);
    const currentRole = toValue(role);
    const settled =
      currentStatus === TableCardStatus.scheduled ||
      currentStatus === TableCardStatus.completed;

    const tabs: TableDetailTab[] = [TableDetailTab.overview];

    if (!settled || currentRole === TableRole.host) {
      tabs.push(TableDetailTab.schedule);
    }

    tabs.push(TableDetailTab.members);

    if (toValue(hasGameSession)) {
      tabs.push(TableDetailTab.playMemo);
    }

    return tabs;
  });

  const tabs = computed<TabItem[]>(() =>
    availableTabs.value.map((tab) => ({ value: tab, label: LABEL[tab] })),
  );

  /** 与えられたタブが今出せるか。出せないなら概要に倒す */
  const resolveActiveTab = (candidate: string): TableDetailTab =>
    availableTabs.value.includes(candidate as TableDetailTab)
      ? (candidate as TableDetailTab)
      : TableDetailTab.overview;

  return { availableTabs, tabs, resolveActiveTab };
};
