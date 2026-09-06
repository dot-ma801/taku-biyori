import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { TableCardStatus } from '@/features/Table/tableCardStatus';
import { TableRole } from '@/features/Table/Detail/tableRole';
import {
  TableDetailTab,
  useTableDetailTabs,
} from '@/features/Table/Detail/useTableDetailTabs';

describe('useTableDetailTabs', () => {
  describe('常に出るタブ', () => {
    it.each([TableRole.host, TableRole.member, TableRole.guest])(
      '立場が "%s" でも概要とメンバーは出る',
      (role) => {
        // Arrange & Act
        const { availableTabs } = useTableDetailTabs(
          TableCardStatus.recruiting,
          role,
          false,
        );

        // Assert
        expect(availableTabs.value).toContain(TableDetailTab.overview);
        expect(availableTabs.value).toContain(TableDetailTab.members);
      },
    );
  });

  describe('日程調整タブ', () => {
    it.each([
      TableCardStatus.recruiting,
      TableCardStatus.adjusting,
      TableCardStatus.cancelled,
    ])('開催が決まっていない "%s" では誰にでも出る', (status) => {
      // Arrange & Act
      const { availableTabs } = useTableDetailTabs(
        status,
        TableRole.guest,
        false,
      );

      // Assert
      expect(availableTabs.value).toContain(TableDetailTab.schedule);
    });

    it.each([TableCardStatus.scheduled, TableCardStatus.completed])(
      '開催が決まった "%s" では参加者・ゲストには出さない',
      (status) => {
        // Arrange & Act
        const { availableTabs } = useTableDetailTabs(
          status,
          TableRole.member,
          true,
        );

        // Assert
        expect(availableTabs.value).not.toContain(TableDetailTab.schedule);
      },
    );

    it.each([TableCardStatus.scheduled, TableCardStatus.completed])(
      '開催が決まった "%s" でもホストには残す（日程を変更できるため）',
      (status) => {
        // Arrange & Act
        const { availableTabs } = useTableDetailTabs(
          status,
          TableRole.host,
          true,
        );

        // Assert
        expect(availableTabs.value).toContain(TableDetailTab.schedule);
      },
    );
  });

  describe('プレイメモタブ', () => {
    it('開催がまだ無い卓では出さない', () => {
      // Arrange & Act
      const { availableTabs } = useTableDetailTabs(
        TableCardStatus.recruiting,
        TableRole.host,
        false,
      );

      // Assert
      expect(availableTabs.value).not.toContain(TableDetailTab.playMemo);
    });

    it.each([TableRole.host, TableRole.member, TableRole.guest])(
      '開催があれば立場 "%s" でもタブ自体は出す（中身の可否はタブ内で分岐する）',
      (role) => {
        // Arrange & Act
        const { availableTabs } = useTableDetailTabs(
          TableCardStatus.scheduled,
          role,
          true,
        );

        // Assert
        expect(availableTabs.value).toContain(TableDetailTab.playMemo);
      },
    );
  });

  describe('タブの並び', () => {
    it('概要 → 日程調整 → メンバー → プレイメモ の順に並ぶ', () => {
      // Arrange & Act
      const { tabs } = useTableDetailTabs(
        TableCardStatus.adjusting,
        TableRole.host,
        true,
      );

      // Assert
      expect(tabs.value.map((t) => t.value)).toEqual([
        TableDetailTab.overview,
        TableDetailTab.schedule,
        TableDetailTab.members,
        TableDetailTab.playMemo,
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
      const { resolveActiveTab } = useTableDetailTabs(
        TableCardStatus.adjusting,
        TableRole.host,
        true,
      );

      // Act & Assert
      expect(resolveActiveTab(TableDetailTab.playMemo)).toBe(
        TableDetailTab.playMemo,
      );
    });

    it('出せないタブを指されたら概要に倒す', () => {
      // Arrange
      const { resolveActiveTab } = useTableDetailTabs(
        TableCardStatus.recruiting,
        TableRole.host,
        false,
      );

      // Act & Assert
      expect(resolveActiveTab(TableDetailTab.playMemo)).toBe(
        TableDetailTab.overview,
      );
    });

    it('知らない値を渡されても概要に倒す', () => {
      // Arrange
      const { resolveActiveTab } = useTableDetailTabs(
        TableCardStatus.recruiting,
        TableRole.host,
        false,
      );

      // Act & Assert
      expect(resolveActiveTab('unknown')).toBe(TableDetailTab.overview);
    });
  });

  describe('リアクティビティ', () => {
    it('開催が生まれるとプレイメモタブが増える', () => {
      // Arrange
      const hasGameSession = ref(false);
      const { availableTabs } = useTableDetailTabs(
        TableCardStatus.scheduled,
        TableRole.host,
        hasGameSession,
      );

      // Act
      hasGameSession.value = true;

      // Assert
      expect(availableTabs.value).toContain(TableDetailTab.playMemo);
    });
  });
});
