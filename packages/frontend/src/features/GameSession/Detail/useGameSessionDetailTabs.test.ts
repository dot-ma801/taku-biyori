import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { GameSessionCardStatus } from '@/features/GameSession/gameSessionCardStatus';
import { GameSessionRole } from '@/features/GameSession/Detail/gameSessionRole';
import {
  GameSessionDetailTab,
  useGameSessionDetailTabs,
} from '@/features/GameSession/Detail/useGameSessionDetailTabs';

describe('useGameSessionDetailTabs', () => {
  describe('常に出るタブ', () => {
    it.each([
      GameSessionRole.host,
      GameSessionRole.member,
      GameSessionRole.guest,
    ])('立場が "%s" でも概要とメンバーは出る', (role) => {
      // Arrange & Act
      const { availableTabs } = useGameSessionDetailTabs(
        GameSessionCardStatus.recruiting,
        role,
        false,
      );

      // Assert
      expect(availableTabs.value).toContain(GameSessionDetailTab.overview);
      expect(availableTabs.value).toContain(GameSessionDetailTab.members);
    });
  });

  describe('日程調整タブ', () => {
    it.each([
      GameSessionCardStatus.recruiting,
      GameSessionCardStatus.adjusting,
      GameSessionCardStatus.cancelled,
    ])('開催が決まっていない "%s" では誰にでも出る', (status) => {
      // Arrange & Act
      const { availableTabs } = useGameSessionDetailTabs(
        status,
        GameSessionRole.guest,
        false,
      );

      // Assert
      expect(availableTabs.value).toContain(GameSessionDetailTab.schedule);
    });

    it.each([GameSessionCardStatus.scheduled, GameSessionCardStatus.completed])(
      '開催が決まった "%s" では参加者・ゲストには出さない',
      (status) => {
        // Arrange & Act
        const { availableTabs } = useGameSessionDetailTabs(
          status,
          GameSessionRole.member,
          true,
        );

        // Assert
        expect(availableTabs.value).not.toContain(
          GameSessionDetailTab.schedule,
        );
      },
    );

    it.each([GameSessionCardStatus.scheduled, GameSessionCardStatus.completed])(
      '開催が決まった "%s" でも、新しい日程調整が始まっていれば全員に出す',
      (status) => {
        // Arrange & Act
        // 「日程を変更する」でやり直した調整に、参加者・ゲストも回答する必要がある
        const { availableTabs } = useGameSessionDetailTabs(
          status,
          GameSessionRole.guest,
          true,
          true,
        );

        // Assert
        expect(availableTabs.value).toContain(GameSessionDetailTab.schedule);
      },
    );

    it.each([GameSessionCardStatus.scheduled, GameSessionCardStatus.completed])(
      '開催が決まった "%s" でもホストには残す（日程を変更できるため）',
      (status) => {
        // Arrange & Act
        const { availableTabs } = useGameSessionDetailTabs(
          status,
          GameSessionRole.host,
          true,
        );

        // Assert
        expect(availableTabs.value).toContain(GameSessionDetailTab.schedule);
      },
    );
  });

  describe('プレイメモタブ', () => {
    it('開催がまだ無い卓では出さない', () => {
      // Arrange & Act
      const { availableTabs } = useGameSessionDetailTabs(
        GameSessionCardStatus.recruiting,
        GameSessionRole.host,
        false,
      );

      // Assert
      expect(availableTabs.value).not.toContain(GameSessionDetailTab.playMemo);
    });

    it.each([
      GameSessionRole.host,
      GameSessionRole.member,
      GameSessionRole.guest,
    ])(
      '開催があれば立場 "%s" でもタブ自体は出す（中身の可否はタブ内で分岐する）',
      (role) => {
        // Arrange & Act
        const { availableTabs } = useGameSessionDetailTabs(
          GameSessionCardStatus.scheduled,
          role,
          true,
        );

        // Assert
        expect(availableTabs.value).toContain(GameSessionDetailTab.playMemo);
      },
    );
  });

  describe('タブの並び', () => {
    it('概要 → 日程調整 → メンバー → プレイメモ の順に並ぶ', () => {
      // Arrange & Act
      const { tabs } = useGameSessionDetailTabs(
        GameSessionCardStatus.adjusting,
        GameSessionRole.host,
        true,
      );

      // Assert
      expect(tabs.value.map((t) => t.value)).toEqual([
        GameSessionDetailTab.overview,
        GameSessionDetailTab.schedule,
        GameSessionDetailTab.members,
        GameSessionDetailTab.playMemo,
      ]);
      expect(tabs.value.map((t) => t.label)).toEqual([
        '概要',
        '日程調整',
        'メンバー',
        'プレイメモ',
      ]);
    });
  });

  describe('resolveActiveTab', () => {
    it('出せるタブならそのまま返す', () => {
      // Arrange
      const { resolveActiveTab } = useGameSessionDetailTabs(
        GameSessionCardStatus.adjusting,
        GameSessionRole.host,
        true,
      );

      // Act & Assert
      expect(resolveActiveTab(GameSessionDetailTab.playMemo)).toBe(
        GameSessionDetailTab.playMemo,
      );
    });

    it('出せないタブを指されたら概要に倒す', () => {
      // Arrange
      const { resolveActiveTab } = useGameSessionDetailTabs(
        GameSessionCardStatus.recruiting,
        GameSessionRole.host,
        false,
      );

      // Act & Assert
      expect(resolveActiveTab(GameSessionDetailTab.playMemo)).toBe(
        GameSessionDetailTab.overview,
      );
    });

    it('知らない値を渡されても概要に倒す', () => {
      // Arrange
      const { resolveActiveTab } = useGameSessionDetailTabs(
        GameSessionCardStatus.recruiting,
        GameSessionRole.host,
        false,
      );

      // Act & Assert
      expect(resolveActiveTab('unknown')).toBe(GameSessionDetailTab.overview);
    });
  });

  describe('リアクティビティ', () => {
    it('開催が生まれるとプレイメモタブが増える', () => {
      // Arrange
      const hasGameSession = ref(false);
      const { availableTabs } = useGameSessionDetailTabs(
        GameSessionCardStatus.scheduled,
        GameSessionRole.host,
        hasGameSession,
      );

      // Act
      hasGameSession.value = true;

      // Assert
      expect(availableTabs.value).toContain(GameSessionDetailTab.playMemo);
    });
  });
});
