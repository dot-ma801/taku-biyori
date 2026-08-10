import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { LobbyCandidateDateInput } from '@taku-biyori/shared';

/**
 * 候補日リスト（日付 + 時刻メモ）の編集ロジック。
 *
 * BaseDatePicker は日付の配列しか扱えないため、ピッカーの選択結果と
 * 時刻メモ付きの候補日リストとの相互変換をここに閉じ込める。
 *
 * 状態は所有者（呼び出し側）が持ち、変更は onChange で委譲する。
 */
export const useCandidateDateRows = (
  candidates: MaybeRefOrGetter<LobbyCandidateDateInput[]>,
  onChange: (next: LobbyCandidateDateInput[]) => void,
) => {
  /** BaseDatePicker へ渡す日付だけの配列 */
  const selectedDates = computed(() =>
    toValue(candidates).map((candidate) => candidate.date),
  );

  /**
   * ピッカーの選択結果を候補日リストへ反映する。
   * 選択に残っている日付の時刻メモは引き継ぎ、外れた日付のメモは破棄する。
   */
  function setDates(dates: string[]) {
    const noteByDate = new Map(
      toValue(candidates).map((candidate) => [
        candidate.date,
        candidate.timeNote ?? null,
      ]),
    );
    onChange(
      dates.map((date) => ({ date, timeNote: noteByDate.get(date) ?? null })),
    );
  }

  /** 指定した日付の時刻メモを差し替える（空文字は未入力として null に戻す） */
  function setTimeNote(date: string, timeNote: string) {
    onChange(
      toValue(candidates).map((candidate) =>
        candidate.date === date
          ? { date: candidate.date, timeNote: timeNote || null }
          : candidate,
      ),
    );
  }

  /** 指定した日付を候補日リストから外す */
  function removeDate(date: string) {
    onChange(
      toValue(candidates).filter((candidate) => candidate.date !== date),
    );
  }

  return { selectedDates, setDates, setTimeNote, removeDate };
};
