import type { LobbyCandidateDateInput } from '@taku-biyori/shared';
import { DATE_NOTE_MAX_LENGTH, normalizeDateNote } from '@taku-biyori/shared';

/**
 * 作成・編集フォームがローカルに持つ候補日1件分。
 * ひとことは入力中の値をそのまま持つため、未入力は null ではなく空文字で表す。
 */
export type PendingCandidateDate = {
  date: string;
  dateNote: string;
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
  const noteByDate = new Map(
    current.map((entry) => [entry.date, entry.dateNote]),
  );

  return [...new Set(selectedDates)]
    .sort((a, b) => a.localeCompare(b))
    .map((date) => ({ date, dateNote: noteByDate.get(date) ?? '' }));
};

/**
 * ひとことの入力エラー文言。問題なければ null を返す。
 * 送信されるのは正規化後の値なので、検証も正規化後の長さで行う（API 側と同じ基準）。
 */
export const getDateNoteError = (value: string): string | null =>
  (normalizeDateNote(value) ?? '').length > DATE_NOTE_MAX_LENGTH
    ? `ひとことは${DATE_NOTE_MAX_LENGTH}文字以内で入力してください`
    : null;

/** API へ送る形式に変換する。空白のみのひとことは未入力（null）として送る */
export const toCandidateDateInputs = (
  pending: readonly PendingCandidateDate[],
): LobbyCandidateDateInput[] =>
  pending.map((entry) => ({
    date: entry.date,
    dateNote: normalizeDateNote(entry.dateNote),
  }));
