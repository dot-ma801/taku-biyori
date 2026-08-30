import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';

/** 表（table）とカード（card）で操作方法が異なるため、文言を出し分ける */
export type ScheduleViewKind = 'table' | 'card';

const HINTS: Record<ScheduleViewKind, { self: string; guest: string }> = {
  table: {
    self: '「あなた」の列のセルをクリックすると ◯ → △ → ✕ の順に切り替わります',
    guest: 'ゲストの列のセルをクリックすると ◯ → △ → ✕ の順に切り替わります',
  },
  card: {
    self: '「あなたの回答」をタップすると ◯ → △ → ✕ の順に切り替わります',
    guest: 'ゲストのチップをタップすると ◯ → △ → ✕ の順に切り替わります',
  },
};

/**
 * 日程調整の編集モードと、そのときに出す操作ヒントを導出する。
 * 表・カードのどちらの表示でも同じ判定を使えるよう、文言だけ view で切り替える。
 */
export const useScheduleEditHint = (
  // いま編集可能なメンバー列の id 一覧（メンバー編集なら自分のみ、ゲスト編集ならゲスト列すべて）
  editableEntryIds: MaybeRefOrGetter<string[]>,
  myEntryId: MaybeRefOrGetter<string | null>,
  view: ScheduleViewKind,
) => {
  /** いずれかの編集モード中か */
  const isEditing = computed(() => toValue(editableEntryIds).length > 0);

  /** 自分の回答がいま編集可能か（ゲスト編集中は false） */
  const isMyAnswerEditable = computed(() => {
    const entryId = toValue(myEntryId);
    if (!entryId) return false;
    return toValue(editableEntryIds).includes(entryId);
  });

  /** 編集モードに応じた操作ヒントの文言 */
  const editHint = computed(() =>
    isMyAnswerEditable.value ? HINTS[view].self : HINTS[view].guest,
  );

  return { isEditing, isMyAnswerEditable, editHint };
};
