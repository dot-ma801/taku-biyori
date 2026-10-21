import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import type { LobbyEntryModel } from '@/models/lobby';
import type {
  CandidateDateModel,
  ScheduleAnswerModel,
  ScheduleAnswerValue,
} from '@/models/schedule-poll';
import { useSelfAnswerGuide } from '@/features/Lobby/Detail/Schedule/useSelfAnswerGuide';

const SELF_ID = 'entry-self';
const OTHER_ID = 'entry-other';

const entry = (id: string): LobbyEntryModel =>
  ({ id, userId: null, guestName: id }) as LobbyEntryModel;

const date = (
  id: string,
  answers: [entryId: string, answer: ScheduleAnswerValue][] = [],
): CandidateDateModel =>
  ({
    id,
    answersByEntryId: new Map(
      answers.map(([entryId, answer]) => [
        entryId,
        { answer } as ScheduleAnswerModel,
      ]),
    ),
  }) as CandidateDateModel;

describe('useSelfAnswerGuide', () => {
  describe('unansweredCount', () => {
    it('自分が回答していない候補日の数を返す', () => {
      // Arrange
      const dates = [
        date('d1', [[SELF_ID, 'ok']]),
        date('d2', [[OTHER_ID, 'ok']]),
        date('d3'),
      ];

      // Act
      const { unansweredCount } = useSelfAnswerGuide([], dates, SELF_ID, true);

      // Assert
      expect(unansweredCount.value).toBe(2);
    });

    it('自分が分からないときは 0 を返す', () => {
      // Arrange & Act
      const { unansweredCount } = useSelfAnswerGuide(
        [],
        [date('d1')],
        null,
        true,
      );

      // Assert
      expect(unansweredCount.value).toBe(0);
    });
  });

  describe('isGuideVisible', () => {
    it('案内中で未回答が残っていれば表示する', () => {
      // Arrange & Act
      const { isGuideVisible } = useSelfAnswerGuide(
        [],
        [date('d1')],
        SELF_ID,
        true,
      );

      // Assert
      expect(isGuideVisible.value).toBe(true);
    });

    it('案内中でなければ表示しない（閉じた・参加操作をしていない）', () => {
      // Arrange & Act
      const { isGuideVisible } = useSelfAnswerGuide(
        [],
        [date('d1')],
        SELF_ID,
        false,
      );

      // Assert
      expect(isGuideVisible.value).toBe(false);
    });

    it('自分の回答がすべて埋まると表示しない', () => {
      // Arrange
      const dates = ref([date('d1')]);
      const { isGuideVisible } = useSelfAnswerGuide([], dates, SELF_ID, true);

      // Act
      dates.value = [date('d1', [[SELF_ID, 'ng']])];

      // Assert
      expect(isGuideVisible.value).toBe(false);
    });

    it('候補日がまだ無い（読み込み前を含む）ときは表示しない', () => {
      // Arrange & Act
      const { isGuideVisible } = useSelfAnswerGuide([], [], SELF_ID, true);

      // Assert
      expect(isGuideVisible.value).toBe(false);
    });
  });

  describe('orderedMembers', () => {
    it('自分を先頭に並べ、他の順序は保つ', () => {
      // Arrange
      const members = [entry('a'), entry(SELF_ID), entry('b')];

      // Act
      const { orderedMembers } = useSelfAnswerGuide(
        members,
        [],
        SELF_ID,
        false,
      );

      // Assert
      expect(orderedMembers.value.map((m) => m.id)).toEqual([
        SELF_ID,
        'a',
        'b',
      ]);
    });

    it('自分が分からないときはそのままの順序を返す', () => {
      // Arrange
      const members = [entry('a'), entry('b')];

      // Act
      const { orderedMembers } = useSelfAnswerGuide(members, [], null, false);

      // Assert
      expect(orderedMembers.value.map((m) => m.id)).toEqual(['a', 'b']);
    });
  });
});
