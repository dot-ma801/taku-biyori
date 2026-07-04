import type { Ref } from 'vue';
import type { AvailabilityDate, GameSessionMember } from '@taku-biyori/shared';
import type { Answer } from '@/features/GameSession/Detail/Schedule/types';

export const useScheduleView = (
  // いま編集可能なメンバー列の id 一覧（メンバー編集なら自分のみ、ゲスト編集ならゲスト列すべて）
  editableMemberIds: Ref<string[]>,
  // 編集中ドラフト。`${memberId}::${dateId}` → 回答
  draftAnswers: Ref<Map<string, Answer>>,
) => {
  // 編集可能な列は draft を優先、それ以外（または draft がなければ）API データを返す
  function getAnswer(date: AvailabilityDate, memberId: string): Answer | null {
    if (editableMemberIds.value.includes(memberId)) {
      const draft = draftAnswers.value.get(`${memberId}::${date.id}`);
      if (draft) return draft;
    }
    const found = date.answers.find((a) => a.memberId === memberId);
    return (found?.answer as Answer) ?? null;
  }

  function okCount(
    date: AvailabilityDate,
    members: GameSessionMember[],
  ): number {
    return members.filter((m) => getAnswer(date, m.id) === 'ok').length;
  }

  // 回答種別ごとの件数（未回答はどのカウントにも含めない）。カード表示の集計に使う
  function answerCounts(
    date: AvailabilityDate,
    members: GameSessionMember[],
  ): Record<Answer, number> {
    const counts: Record<Answer, number> = { ok: 0, maybe: 0, ng: 0 };
    for (const member of members) {
      const answer = getAnswer(date, member.id);
      if (answer) {
        counts[answer] += 1;
      }
    }
    return counts;
  }

  return { getAnswer, okCount, answerCounts };
};
