import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { TabItem } from '@/components/common/BaseTabs/BaseTabs.vue';
import type { GameSessionCardModel } from '@/features/GameSession/toGameSessionCards';
import {
  GAME_SESSION_CARD_STATUS_LABEL,
  GAME_SESSION_LIST_TAB_STATUSES,
  GameSessionCardStatus,
} from '@/features/GameSession/gameSessionCardStatus';

/** 状態ごとの空状態の文言。謝らず、次の一歩だけを示す */
const EMPTY_MESSAGE: Record<GameSessionCardStatus, string> = {
  [GameSessionCardStatus.draft]: '下書きの卓はありません',
  [GameSessionCardStatus.recruiting]:
    'いま募集している卓はありません。卓をつくると、ここに並びます',
  [GameSessionCardStatus.adjusting]: '日程を調整している卓はありません',
  [GameSessionCardStatus.scheduled]: '開催日の決まった卓はありません',
  [GameSessionCardStatus.completed]: '終えた卓はまだありません',
  [GameSessionCardStatus.cancelled]: '中止した卓はありません',
};

const isGameSessionCardStatus = (
  value: string,
): value is GameSessionCardStatus =>
  (GAME_SESSION_LIST_TAB_STATUSES as readonly string[]).includes(value);

/**
 * 卓一覧のタブ。件数バッジ・タブごとの絞り込み・空状態の文言をまとめて解決する。
 *
 * 読み取りは getter で受け取り、依存の向き（呼び出し側 → composable）を一方向に保つ。
 */
export const useGameSessionListTabs = (
  cards: MaybeRefOrGetter<GameSessionCardModel[]>,
  activeTab: MaybeRefOrGetter<string>,
) => {
  const tabs = computed<TabItem[]>(() => {
    const all = toValue(cards);
    return GAME_SESSION_LIST_TAB_STATUSES.map((status) => {
      const count = all.filter((c) => c.status === status).length;
      return {
        value: status,
        label: `${GAME_SESSION_CARD_STATUS_LABEL[status]} ${count}`,
      };
    });
  });

  /** いま開いているタブの状態。未知の値なら先頭のタブに倒す */
  const activeStatus = computed<GameSessionCardStatus>(() => {
    const value = toValue(activeTab);
    return isGameSessionCardStatus(value)
      ? value
      : GameSessionCardStatus.recruiting;
  });

  const cardsOfActiveTab = computed(() =>
    toValue(cards).filter((c) => c.status === activeStatus.value),
  );

  const emptyMessage = computed(() => EMPTY_MESSAGE[activeStatus.value]);

  return { tabs, activeStatus, cardsOfActiveTab, emptyMessage };
};
