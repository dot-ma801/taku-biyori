import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { LobbyEntryModel } from '@/models/lobby';
import type { CandidateDateModel } from '@/models/schedule-poll';

/**
 * 「自分の回答」がどこまで埋まっているかと、参加直後の案内の出し分けを導出する。
 * 未回答はサーバ値で数える（編集中のドラフトは含めない。保存されるまで案内を残す）。
 */
export const useSelfAnswerGuide = (
  members: MaybeRefOrGetter<LobbyEntryModel[]>,
  candidateDates: MaybeRefOrGetter<CandidateDateModel[]>,
  // ログインユーザーの entryId、またはこの画面で参加したゲストの entryId
  selfEntryId: MaybeRefOrGetter<string | null>,
  // 参加直後の案内中か（親が持つ。閉じたら false）
  isGuideActive: MaybeRefOrGetter<boolean>,
) => {
  /** 自分が未回答の候補日の数。自分が分からなければ 0 */
  const unansweredCount = computed(() => {
    const selfId = toValue(selfEntryId);
    if (!selfId) {
      return 0;
    }
    return toValue(candidateDates).filter(
      (date) => !date.answersByEntryId.has(selfId),
    ).length;
  });

  /** 案内バナーを出すか。案内中で、未回答が1件でも残っているあいだだけ */
  const isGuideVisible = computed(
    () => toValue(isGuideActive) && unansweredCount.value > 0,
  );

  /** 自分を先頭にしたメンバー一覧。スマホで自分の欄をすぐ見つけられるようにする */
  const orderedMembers = computed(() => {
    const list = toValue(members);
    const selfId = toValue(selfEntryId);
    const self = list.find((m) => m.id === selfId);
    if (!self) {
      return list;
    }
    return [self, ...list.filter((m) => m.id !== selfId)];
  });

  return { unansweredCount, isGuideVisible, orderedMembers };
};
