import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import type { GameSessionCardModel } from '@/features/GameSession/toGameSessionCards';
import { GameSessionCardStatus } from '@/features/GameSession/gameSessionCardStatus';
import { useGameSessionListTabs } from '@/features/GameSession/List/useGameSessionListTabs';

const makeCard = (
  lobbyId: string,
  status: GameSessionCardStatus,
): GameSessionCardModel => ({
  lobbyId,
  gameSessionId: null,
  title: `卓 ${lobbyId}`,
  scenarioName: null,
  status,
  memberCount: 0,
  maxPlayers: null,
  remainingCount: null,
  isHost: false,
  scheduledAt: null,
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
});

describe('useGameSessionListTabs', () => {
  describe('タブ', () => {
    it('下書きを除いた5つの状態のタブを、系列の順に返す', () => {
      // Arrange & Act
      const { tabs } = useGameSessionListTabs(
        [],
        GameSessionCardStatus.recruiting,
      );

      // Assert
      expect(tabs.value.map((t) => t.value)).toEqual([
        GameSessionCardStatus.recruiting,
        GameSessionCardStatus.adjusting,
        GameSessionCardStatus.scheduled,
        GameSessionCardStatus.completed,
        GameSessionCardStatus.cancelled,
      ]);
    });

    it('ラベルに件数を添える', () => {
      // Arrange
      const cards = [
        makeCard('a', GameSessionCardStatus.recruiting),
        makeCard('b', GameSessionCardStatus.recruiting),
        makeCard('c', GameSessionCardStatus.completed),
      ];

      // Act
      const { tabs } = useGameSessionListTabs(
        cards,
        GameSessionCardStatus.recruiting,
      );

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
        makeCard('a', GameSessionCardStatus.recruiting),
        makeCard('b', GameSessionCardStatus.scheduled),
      ];

      // Act
      const { cardsOfActiveTab } = useGameSessionListTabs(
        cards,
        GameSessionCardStatus.scheduled,
      );

      // Assert
      expect(cardsOfActiveTab.value.map((c) => c.lobbyId)).toEqual(['b']);
    });

    it('タブを切り替えると絞り込みも切り替わる', () => {
      // Arrange
      const cards = [
        makeCard('a', GameSessionCardStatus.recruiting),
        makeCard('b', GameSessionCardStatus.scheduled),
      ];
      const activeTab = ref<string>(GameSessionCardStatus.recruiting);
      const { cardsOfActiveTab } = useGameSessionListTabs(cards, activeTab);

      // Act
      activeTab.value = GameSessionCardStatus.scheduled;

      // Assert
      expect(cardsOfActiveTab.value.map((c) => c.lobbyId)).toEqual(['b']);
    });

    it('未知のタブ値は先頭のタブ（募集中）に倒す', () => {
      // Arrange
      const cards = [makeCard('a', GameSessionCardStatus.recruiting)];

      // Act
      const { activeStatus, cardsOfActiveTab } = useGameSessionListTabs(
        cards,
        'unknown-tab',
      );

      // Assert
      expect(activeStatus.value).toBe(GameSessionCardStatus.recruiting);
      expect(cardsOfActiveTab.value).toHaveLength(1);
    });

    it('下書きの卓はどのタブにも出ない', () => {
      // Arrange
      const cards = [makeCard('draft', GameSessionCardStatus.draft)];

      // Act
      const { tabs } = useGameSessionListTabs(
        cards,
        GameSessionCardStatus.recruiting,
      );

      // Assert
      expect(tabs.value.every((t) => t.label.endsWith(' 0'))).toBe(true);
    });
  });

  describe('空状態の文言', () => {
    it('開いているタブに応じた文言を返す', () => {
      // Arrange & Act
      const { emptyMessage } = useGameSessionListTabs(
        [],
        GameSessionCardStatus.completed,
      );

      // Assert
      expect(emptyMessage.value).toBe('終えた卓はまだありません');
    });
  });
});
