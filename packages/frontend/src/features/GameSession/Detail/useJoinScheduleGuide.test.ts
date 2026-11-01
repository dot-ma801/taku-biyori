import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { GameSessionCardStatus } from '@/features/GameSession/gameSessionCardStatus';
import { GameSessionDetailTab } from '@/features/GameSession/Detail/useGameSessionDetailTabs';
import { useJoinScheduleGuide } from '@/features/GameSession/Detail/useJoinScheduleGuide';

const ENTRY_ID = 'entry-joined';
const WITH_SCHEDULE = [
  GameSessionDetailTab.overview,
  GameSessionDetailTab.schedule,
  GameSessionDetailTab.members,
];
const WITHOUT_SCHEDULE = [
  GameSessionDetailTab.overview,
  GameSessionDetailTab.members,
];

describe('useJoinScheduleGuide', () => {
  describe('handleJoined', () => {
    it.each([
      GameSessionCardStatus.recruiting,
      GameSessionCardStatus.adjusting,
    ])('"%s" で回答待ちの日程調整があれば日程調整タブを返す', (status) => {
      // Arrange
      const { handleJoined } = useJoinScheduleGuide(
        status,
        WITH_SCHEDULE,
        true,
      );

      // Act
      const tab = handleJoined(ENTRY_ID);

      // Assert
      expect(tab).toBe(GameSessionDetailTab.schedule);
    });

    it('案内を出すときは参加した entryId を覚え、案内を表示状態にする', () => {
      // Arrange
      const { handleJoined, joinedEntryId, isGuideActive } =
        useJoinScheduleGuide(
          GameSessionCardStatus.recruiting,
          WITH_SCHEDULE,
          true,
        );

      // Act
      handleJoined(ENTRY_ID);

      // Assert
      expect(joinedEntryId.value).toBe(ENTRY_ID);
      expect(isGuideActive.value).toBe(true);
    });

    it.each([
      GameSessionCardStatus.scheduled,
      GameSessionCardStatus.completed,
      GameSessionCardStatus.cancelled,
      GameSessionCardStatus.draft,
      null,
    ])('"%s" では案内を出さず null を返す', (status) => {
      // Arrange
      const { handleJoined, isGuideActive } = useJoinScheduleGuide(
        status,
        WITH_SCHEDULE,
        true,
      );

      // Act
      const tab = handleJoined(ENTRY_ID);

      // Assert
      expect(tab).toBeNull();
      expect(isGuideActive.value).toBe(false);
    });

    it('回答待ちの日程調整が無ければ案内を出さない', () => {
      // Arrange
      const { handleJoined, isGuideActive } = useJoinScheduleGuide(
        GameSessionCardStatus.recruiting,
        WITH_SCHEDULE,
        false,
      );

      // Act
      const tab = handleJoined(ENTRY_ID);

      // Assert
      expect(tab).toBeNull();
      expect(isGuideActive.value).toBe(false);
    });

    it('日程調整タブが出ていなければ案内を出さない', () => {
      // Arrange
      const { handleJoined } = useJoinScheduleGuide(
        GameSessionCardStatus.recruiting,
        WITHOUT_SCHEDULE,
        true,
      );

      // Act
      const tab = handleJoined(ENTRY_ID);

      // Assert
      expect(tab).toBeNull();
    });

    it('案内を出さないときも参加した entryId は覚える（ゲストの「自分」の識別に使う）', () => {
      // Arrange
      const { handleJoined, joinedEntryId } = useJoinScheduleGuide(
        GameSessionCardStatus.scheduled,
        WITH_SCHEDULE,
        false,
      );

      // Act
      handleJoined(ENTRY_ID);

      // Assert
      expect(joinedEntryId.value).toBe(ENTRY_ID);
    });
  });

  describe('初期状態', () => {
    it('参加操作をしていなければ案内は出ていない（参加済みでページを開いた場合）', () => {
      // Arrange & Act
      const { joinedEntryId, isGuideActive } = useJoinScheduleGuide(
        GameSessionCardStatus.recruiting,
        WITH_SCHEDULE,
        true,
      );

      // Assert
      expect(joinedEntryId.value).toBeNull();
      expect(isGuideActive.value).toBe(false);
    });
  });

  describe('dismissGuide', () => {
    it('案内を閉じても参加した entryId は残る', () => {
      // Arrange
      const { handleJoined, dismissGuide, joinedEntryId, isGuideActive } =
        useJoinScheduleGuide(
          GameSessionCardStatus.recruiting,
          WITH_SCHEDULE,
          true,
        );
      handleJoined(ENTRY_ID);

      // Act
      dismissGuide();

      // Assert
      expect(isGuideActive.value).toBe(false);
      expect(joinedEntryId.value).toBe(ENTRY_ID);
    });
  });

  describe('状態の追従', () => {
    it('参加判定は呼んだ時点の値で行う', () => {
      // Arrange
      const status = ref<GameSessionCardStatus | null>(null);
      const { handleJoined } = useJoinScheduleGuide(
        status,
        WITH_SCHEDULE,
        true,
      );
      status.value = GameSessionCardStatus.recruiting;

      // Act
      const tab = handleJoined(ENTRY_ID);

      // Assert
      expect(tab).toBe(GameSessionDetailTab.schedule);
    });
  });
});
