import { toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { LobbyAvailabilityDate, LobbyMember } from '@taku-biyori/shared';
import type { Answer } from '@/features/Lobby/Detail/Schedule/types';

export const useScheduleView = (
  // いま編集可能なメンバー列の id 一覧（メンバー編集なら自分のみ、ゲスト編集ならゲスト列すべて）
  editableMemberIds: MaybeRefOrGetter<string[]>,
  // 編集中ドラフト。`${memberId}::${dateId}` → 回答
  draftAnswers: MaybeRefOrGetter<Map<string, Answer>>,
) => {
  /** 編集可能な列は draft を優先、それ以外（または draft がなければ）API データを返す */
  function getAnswer(
    date: LobbyAvailabilityDate,
    memberId: string,
  ): Answer | null {
    if (toValue(editableMemberIds).includes(memberId)) {
      const draft = toValue(draftAnswers).get(`${memberId}::${date.id}`);
      if (draft) return draft;
    }
    const found = date.answers.find((a) => a.memberId === memberId);
    return (found?.answer as Answer) ?? null;
  }

  /** 指定候補日に ok と回答したメンバー数 */
  function okCount(
    date: LobbyAvailabilityDate,
    members: LobbyMember[],
  ): number {
    return members.filter((m) => getAnswer(date, m.id) === 'ok').length;
  }

  // 回答種別ごとの件数（未回答はどのカウントにも含めない）。カード表示の集計に使う
  function answerCounts(
    date: LobbyAvailabilityDate,
    members: LobbyMember[],
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
