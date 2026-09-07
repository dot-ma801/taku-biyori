import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { TabItem } from '@/components/common/BaseTabs/BaseTabs.vue';
import { GameSessionCardStatus } from '@/features/GameSession/gameSessionCardStatus';
import { GameSessionRole } from '@/features/GameSession/Detail/gameSessionRole';

/** 卓詳細のタブ */
export enum GameSessionDetailTab {
  overview = 'overview',
  schedule = 'schedule',
  members = 'members',
  playMemo = 'playMemo',
}

const LABEL: Record<GameSessionDetailTab, string> = {
  [GameSessionDetailTab.overview]: '概要',
  [GameSessionDetailTab.schedule]: '日程調整',
  [GameSessionDetailTab.members]: 'メンバー',
  [GameSessionDetailTab.playMemo]: 'プレイメモ',
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
export const useGameSessionDetailTabs = (
  status: MaybeRefOrGetter<GameSessionCardStatus | null>,
  role: MaybeRefOrGetter<GameSessionRole>,
  hasGameSession: MaybeRefOrGetter<boolean>,
) => {
  const availableTabs = computed<GameSessionDetailTab[]>(() => {
    const currentStatus = toValue(status);
    const currentRole = toValue(role);
    const settled =
      currentStatus === GameSessionCardStatus.scheduled ||
      currentStatus === GameSessionCardStatus.completed;

    const tabs: GameSessionDetailTab[] = [GameSessionDetailTab.overview];

    if (!settled || currentRole === GameSessionRole.host) {
      tabs.push(GameSessionDetailTab.schedule);
    }

    tabs.push(GameSessionDetailTab.members);

    if (toValue(hasGameSession)) {
      tabs.push(GameSessionDetailTab.playMemo);
    }

    return tabs;
  });

  const tabs = computed<TabItem[]>(() =>
    availableTabs.value.map((tab) => ({ value: tab, label: LABEL[tab] })),
  );

  /** 与えられたタブが今出せるか。出せないなら概要に倒す */
  const resolveActiveTab = (candidate: string): GameSessionDetailTab =>
    availableTabs.value.includes(candidate as GameSessionDetailTab)
      ? (candidate as GameSessionDetailTab)
      : GameSessionDetailTab.overview;

  return { availableTabs, tabs, resolveActiveTab };
};
