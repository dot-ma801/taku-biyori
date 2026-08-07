import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { MyGameSessionPlayMemo } from '@taku-biyori/shared';
import type { PlayMemoMemberEntry } from '@/features/GameSession/PlayMemo/useSharedPlayMemos';

/**
 * メモ画面の「何を出すか」を決める composable。
 *
 * `showSidebar` / `showEditor` / `readerEntry` / `showFailedNotice` /
 * `showLoading` は権限・可視性に直結する導出であり、CLAUDE.md の
 * 「コンポーネントの責務はテンプレートの構造制御に限定する」
 * 「データの導出は composable に寄せる」に沿ってここへ集約する。
 * これによりローディング境界・失敗時の表示範囲をユニットテストで固定できる。
 *
 * すべて読み取り専用の導出（このモジュールは ref を所有しない）。
 */
export const usePlayMemoPane = (params: {
  loadingMemo: MaybeRefOrGetter<boolean>;
  loadingSharedPlayMemos: MaybeRefOrGetter<boolean>;
  isMyMemo: MaybeRefOrGetter<boolean>;
  playMemo: MaybeRefOrGetter<MyGameSessionPlayMemo | null>;
  canViewShared: MaybeRefOrGetter<boolean>;
  selectedEntry: MaybeRefOrGetter<PlayMemoMemberEntry | null>;
  isMineSelected: MaybeRefOrGetter<boolean>;
}) => {
  /** サイドバーを出すか。完了・中止していれば、誰も公開していなくても出す */
  const showSidebar = computed(() => toValue(params.canViewShared));

  /**
   * 自分のメモを編集画面（エディタ）で開いているか。
   * 本文（playMemo）が届く前は false になる。サイドバーを出さない時期は
   * 常に自分のメモなので `isMineSelected` でも判定する。
   */
  const showEditor = computed(
    () =>
      toValue(params.isMyMemo) &&
      toValue(params.playMemo) !== null &&
      (!showSidebar.value || toValue(params.isMineSelected)),
  );

  /**
   * 自分のメモの取得に失敗したか（取得は完了したが `playMemo` が null）。
   *
   * `loadingMemo` が true の間はまだ「失敗」と確定していないため false のまま。
   * ここで確定させないと、本文到着前に「保存された本文がありません」のような
   * 誤表示が一瞬出てしまう（① の指摘）。
   */
  const showFailedNotice = computed(
    () =>
      toValue(params.isMineSelected) &&
      !toValue(params.loadingMemo) &&
      toValue(params.isMyMemo) &&
      toValue(params.playMemo) === null,
  );

  /**
   * 他メンバーの行を開いているか（読めない相手もここに来る）。
   *
   * 自分の行は常にエディタ／失敗表示の担当なのでここには来ない
   * （`isMineSelected` で弾く）。`sharedPlayMemos` の応答が届く前は、
   * 一覧が空のせいで「非公開」と誤って断定されてしまうため、
   * `loadingSharedPlayMemos` の間は null にしてローディング表示へ倒す。
   */
  const readerEntry = computed<PlayMemoMemberEntry | null>(() => {
    if (toValue(params.isMineSelected)) return null;
    if (toValue(params.loadingSharedPlayMemos)) return null;
    return toValue(params.selectedEntry);
  });

  /** 開くものがまだ決まらない間（何を出すべきか確定していない） */
  const showLoading = computed(
    () =>
      !showEditor.value &&
      !showFailedNotice.value &&
      readerEntry.value === null &&
      (toValue(params.isMineSelected)
        ? toValue(params.loadingMemo)
        : toValue(params.loadingSharedPlayMemos)),
  );

  return {
    showSidebar,
    showEditor,
    showFailedNotice,
    readerEntry,
    showLoading,
  };
};
