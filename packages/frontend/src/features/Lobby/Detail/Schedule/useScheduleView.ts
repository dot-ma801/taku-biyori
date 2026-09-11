import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { LobbyEntryModel } from '@/models/lobby';
import type {
  CandidateDateModel,
  ScheduleAnswerValue,
} from '@/models/schedule-poll';

/**
 * 候補日・メンバー一覧から表示用の値（回答・集計・列の要否）を導出する composable。
 * 表（ScheduleTable）・カード（ScheduleCardList）の両方の表示から共通で使う。
 */
export const useScheduleView = (
  // いま編集可能なメンバー列の id 一覧（メンバー編集なら自分のみ、ゲスト編集ならゲスト列すべて）
  editableEntryIds: MaybeRefOrGetter<string[]>,
  // 編集中ドラフト。`${entryId}::${candidateDateId}` → 回答
  draftAnswers: MaybeRefOrGetter<Map<string, ScheduleAnswerValue>>,
  // ひとこと（timeLabel）列の要否を判定するための候補日一覧（回答の集計だけに使う呼び出し元は省略できる）
  candidateDates: MaybeRefOrGetter<CandidateDateModel[]> = () => [],
) => {
  /** 編集可能な列は draft を優先、それ以外（または draft がなければ）サーバ値を返す */
  function getAnswer(
    date: CandidateDateModel,
    entryId: string,
  ): ScheduleAnswerValue | null {
    if (toValue(editableEntryIds).includes(entryId)) {
      const draft = toValue(draftAnswers).get(`${entryId}::${date.id}`);
      if (draft) return draft;
    }
    return date.answersByEntryId.get(entryId)?.answer ?? null;
  }

  /** 指定候補日に ok と回答したメンバー数 */
  function okCount(
    date: CandidateDateModel,
    members: LobbyEntryModel[],
  ): number {
    return members.filter((m) => getAnswer(date, m.id) === 'ok').length;
  }

  // 回答種別ごとの件数（未回答はどのカウントにも含めない）。カード表示の集計に使う
  function answerCounts(
    date: CandidateDateModel,
    members: LobbyEntryModel[],
  ): Record<ScheduleAnswerValue, number> {
    const counts: Record<ScheduleAnswerValue, number> = {
      ok: 0,
      maybe: 0,
      ng: 0,
    };
    for (const member of members) {
      const answer = getAnswer(date, member.id);
      if (answer) {
        counts[answer] += 1;
      }
    }
    return counts;
  }

  /**
   * ホストが「ひとこと（timeLabel）」を1件でも書いているか。
   * 表のひとこと列は、書かれていなければ列ごと出さない（メンバーが増えたときに
   * 使われていない列で横スクロールを早めないため）。
   */
  const hasAnyTimeLabel = computed(() =>
    toValue(candidateDates).some((date) => Boolean(date.timeLabel)),
  );

  return { getAnswer, okCount, answerCounts, hasAnyTimeLabel };
};
