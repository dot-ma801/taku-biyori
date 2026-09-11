import type { LobbyCandidateDateInput } from '@taku-biyori/shared';
import { TIME_LABEL_MAX_LENGTH, normalizeTimeLabel } from '@taku-biyori/shared';
import { formatDateWithWeekday } from '@/utils/date';

/**
 * 作成・編集フォームがローカルに持つ候補日1件分。
 * ひとことは入力中の値をそのまま持つため、未入力は null ではなく空文字で表す。
 */
export type PendingCandidateDate = {
  date: string;
  timeLabel: string;
};

/**
 * 日付ピッカーの選択（日付の配列）を候補日リストへ反映する。
 *
 * 残る日付のひとことは保持し、増えた日付は空のひとことで追加する。
 * 選んだ順ではなく日付の昇順に整えるので、表示・送信のどちらでも読み順が安定する。
 */
export const syncPendingDates = (
  current: readonly PendingCandidateDate[],
  selectedDates: readonly string[],
): PendingCandidateDate[] => {
  const timeLabelByDate = new Map(
    current.map((entry) => [entry.date, entry.timeLabel]),
  );

  return [...new Set(selectedDates)]
    .sort((a, b) => a.localeCompare(b))
    .map((date) => ({ date, timeLabel: timeLabelByDate.get(date) ?? '' }));
};

// 保存されるのは正規化後の値なので、検証もカウンターも正規化後の長さで数える
// （生の長さで数えると「21/20 と出ているのにエラーにならない」がありうる）。
const timeLabelLength = (value: string): number =>
  (normalizeTimeLabel(value) ?? '').length;

/**
 * ひとことの入力エラー文言。問題なければ null を返す。
 * 送信されるのは正規化後の値なので、検証も正規化後の長さで行う（API 側と同じ基準）。
 */
export const getTimeLabelError = (value: string): string | null =>
  timeLabelLength(value) > TIME_LABEL_MAX_LENGTH
    ? `ひとことは${TIME_LABEL_MAX_LENGTH}文字以内で入力してください`
    : null;

/**
 * 送信時にフォーム全体を検証した結果のエラー文言。
 *
 * blur 時の `rules` は送信をブロックしないので（送信ボタンの活性は
 * `errorMessages` だけを見ている）、送信側でも同じ基準で弾く。
 * 複数の候補日ぶんがまとめてアラートに並ぶため、どの日のことか分かる文言にする。
 */
export const getPendingTimeLabelErrors = (
  pending: readonly PendingCandidateDate[],
): string[] =>
  pending.flatMap((entry) => {
    const error = getTimeLabelError(entry.timeLabel);
    return error ? [`${formatDateWithWeekday(entry.date)}の${error}`] : [];
  });

/** 入力欄に添える文字数カウンター（プレイメモの `N / MAX` と同じ形式） */
export const getTimeLabelCounter = (
  value: string,
): { label: string; isOver: boolean } => {
  const length = timeLabelLength(value);
  return {
    label: `${length} / ${TIME_LABEL_MAX_LENGTH}`,
    isOver: length > TIME_LABEL_MAX_LENGTH,
  };
};

/** API へ送る形式に変換する。空白のみのひとことは未入力（null）として送る */
export const toCandidateDateInputs = (
  pending: readonly PendingCandidateDate[],
): LobbyCandidateDateInput[] =>
  pending.map((entry) => ({
    date: entry.date,
    timeLabel: normalizeTimeLabel(entry.timeLabel),
  }));
