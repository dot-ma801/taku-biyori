export interface CandidateDateDiff {
  datesToAdd: string[];
  dateIdsToRemove: string[];
}

/**
 * 候補日の一括更新で適用すべき差分を計算する。
 *
 * 既存とリクエストの両方にある日付は対象外とする（行を保持することで、
 * その候補日に紐づく回答をカスケード削除から守る）。
 * リクエスト内の重複日付は1件として扱う。
 */
export const diffCandidateDates = (
  existing: readonly { id: string; date: string }[],
  requested: readonly string[],
): CandidateDateDiff => {
  const existingDates = new Set(existing.map((entry) => entry.date));
  const requestedDates = new Set(requested);

  const datesToAdd = [...requestedDates].filter(
    (date) => !existingDates.has(date),
  );
  const dateIdsToRemove = existing
    .filter((entry) => !requestedDates.has(entry.date))
    .map((entry) => entry.id);

  return { datesToAdd, dateIdsToRemove };
};
