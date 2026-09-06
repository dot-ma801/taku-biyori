import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { TabItem } from '@/components/common/BaseTabs/BaseTabs.vue';
import type { TableCardModel } from '@/features/Table/toTableCards';
import {
  TABLE_CARD_STATUS_LABEL,
  TABLE_LIST_TAB_STATUSES,
  TableCardStatus,
} from '@/features/Table/tableCardStatus';

/** 状態ごとの空状態の文言。謝らず、次の一歩だけを示す */
const EMPTY_MESSAGE: Record<TableCardStatus, string> = {
  [TableCardStatus.draft]: '下書きの卓はありません',
  [TableCardStatus.recruiting]:
    'いま募集している卓はありません。卓をつくると、ここに並びます',
  [TableCardStatus.adjusting]: '日程を調整している卓はありません',
  [TableCardStatus.scheduled]: '開催日の決まった卓はありません',
  [TableCardStatus.completed]: '終えた卓はまだありません',
  [TableCardStatus.cancelled]: '中止した卓はありません',
};

const isTableCardStatus = (value: string): value is TableCardStatus =>
  (TABLE_LIST_TAB_STATUSES as readonly string[]).includes(value);

/**
 * 卓一覧のタブ。件数バッジ・タブごとの絞り込み・空状態の文言をまとめて解決する。
 *
 * 読み取りは getter で受け取り、依存の向き（呼び出し側 → composable）を一方向に保つ。
 */
export const useTableListTabs = (
  cards: MaybeRefOrGetter<TableCardModel[]>,
  activeTab: MaybeRefOrGetter<string>,
) => {
  const tabs = computed<TabItem[]>(() => {
    const all = toValue(cards);
    return TABLE_LIST_TAB_STATUSES.map((status) => {
      const count = all.filter((c) => c.status === status).length;
      return {
        value: status,
        label: `${TABLE_CARD_STATUS_LABEL[status]} ${count}`,
      };
    });
  });

  /** いま開いているタブの状態。未知の値なら先頭のタブに倒す */
  const activeStatus = computed<TableCardStatus>(() => {
    const value = toValue(activeTab);
    return isTableCardStatus(value) ? value : TableCardStatus.recruiting;
  });

  const cardsOfActiveTab = computed(() =>
    toValue(cards).filter((c) => c.status === activeStatus.value),
  );

  const emptyMessage = computed(() => EMPTY_MESSAGE[activeStatus.value]);

  return { tabs, activeStatus, cardsOfActiveTab, emptyMessage };
};
