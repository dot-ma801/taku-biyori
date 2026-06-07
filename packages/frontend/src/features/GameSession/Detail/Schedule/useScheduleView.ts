import type { Ref } from 'vue';
import type { AvailabilityDate, GameSessionMember } from '@taku-biyori/shared';
import type { Answer } from '@/features/GameSession/Detail/Schedule/types';

export const useScheduleView = (
  myMemberId: Ref<string | null>,
  isEditing: Ref<boolean>,
  draftAnswers: Ref<Map<string, Answer>>,
) => {
  // 編集中は draft を優先、閲覧中または draft がなければ API データを返す
  function getAnswer(date: AvailabilityDate, memberId: string): Answer | null {
    if (memberId === myMemberId.value && isEditing.value) {
      const draft = draftAnswers.value.get(date.id);
      if (draft) return draft;
    }
    const found = date.answers.find((a) => a.memberId === memberId);
    return (found?.answer as Answer) ?? null;
  }

  function okCount(date: AvailabilityDate, members: GameSessionMember[]): number {
    return members.filter((m) => getAnswer(date, m.id) === 'ok').length;
  }

  return { getAnswer, okCount };
};
