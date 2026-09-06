import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import type { TableCardModel } from '@/features/Table/toTableCards';
import { TableCardStatus } from '@/features/Table/tableCardStatus';
import { useTableListTabs } from '@/features/Table/List/useTableListTabs';

const makeCard = (
  lobbyId: string,
  status: TableCardStatus,
): TableCardModel => ({
  lobbyId,
  gameSessionId: null,
  title: `卓 ${lobbyId}`,
  scenarioName: null,
  status,
  memberCount: 0,
  maxPlayers: null,
  remainingCount: null,
  isHost: false,
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
});

describe('useTableListTabs', () => {
  describe('タブ', () => {
    it('下書きを除いた5つの状態のタブを、系列の順に返す', () => {
      // Arrange & Act
      const { tabs } = useTableListTabs([], TableCardStatus.recruiting);

      // Assert
      expect(tabs.value.map((t) => t.value)).toEqual([
        TableCardStatus.recruiting,
        TableCardStatus.adjusting,
        TableCardStatus.scheduled,
        TableCardStatus.completed,
        TableCardStatus.cancelled,
      ]);
    });

    it('ラベルに件数を添える', () => {
      // Arrange
      const cards = [
        makeCard('a', TableCardStatus.recruiting),
        makeCard('b', TableCardStatus.recruiting),
        makeCard('c', TableCardStatus.completed),
      ];

      // Act
      const { tabs } = useTableListTabs(cards, TableCardStatus.recruiting);

      // Assert
      expect(tabs.value[0]?.label).toBe('募集中 2');
      expect(tabs.value[3]?.label).toBe('完了 1');
      expect(tabs.value[1]?.label).toBe('調整中 0');
    });
  });

  describe('タブごとの絞り込み', () => {
    it('開いているタブの状態の卓だけを返す', () => {
      // Arrange
      const cards = [
        makeCard('a', TableCardStatus.recruiting),
        makeCard('b', TableCardStatus.scheduled),
      ];

      // Act
      const { cardsOfActiveTab } = useTableListTabs(
        cards,
        TableCardStatus.scheduled,
      );

      // Assert
      expect(cardsOfActiveTab.value.map((c) => c.lobbyId)).toEqual(['b']);
    });

    it('タブを切り替えると絞り込みも切り替わる', () => {
      // Arrange
      const cards = [
        makeCard('a', TableCardStatus.recruiting),
        makeCard('b', TableCardStatus.scheduled),
      ];
      const activeTab = ref<string>(TableCardStatus.recruiting);
      const { cardsOfActiveTab } = useTableListTabs(cards, activeTab);

      // Act
      activeTab.value = TableCardStatus.scheduled;

      // Assert
      expect(cardsOfActiveTab.value.map((c) => c.lobbyId)).toEqual(['b']);
    });

    it('未知のタブ値は先頭のタブ（募集中）に倒す', () => {
      // Arrange
      const cards = [makeCard('a', TableCardStatus.recruiting)];

      // Act
      const { activeStatus, cardsOfActiveTab } = useTableListTabs(
        cards,
        'unknown-tab',
      );

      // Assert
      expect(activeStatus.value).toBe(TableCardStatus.recruiting);
      expect(cardsOfActiveTab.value).toHaveLength(1);
    });

    it('下書きの卓はどのタブにも出ない', () => {
      // Arrange
      const cards = [makeCard('draft', TableCardStatus.draft)];

      // Act
      const { tabs } = useTableListTabs(cards, TableCardStatus.recruiting);

      // Assert
      expect(tabs.value.every((t) => t.label.endsWith(' 0'))).toBe(true);
    });
  });

  describe('空状態の文言', () => {
    it('開いているタブに応じた文言を返す', () => {
      // Arrange & Act
      const { emptyMessage } = useTableListTabs([], TableCardStatus.completed);

      // Assert
      expect(emptyMessage.value).toBe('終えた卓はまだありません');
    });
  });
});
