/** 候補日1件分の「あるべき状態」。日付と、その日に添えるひとこと（自由記述） */
export interface CandidateDateEntry {
  date: string;
  dateNote: string | null;
}

export interface CandidateDateDiff {
  datesToAdd: CandidateDateEntry[];
  dateIdsToRemove: string[];
  /** 日付は残るがひとことだけ変わった行 */
  notesToUpdate: { id: string; dateNote: string | null }[];
}

/**
 * 候補日の一括更新で適用すべき差分を計算する。
 *
 * 既存とリクエストの両方にある日付は削除・再作成せず行を保持する（行 ID が変わると
 * その候補日に紐づく回答が cascade で消えるため）。保持する行のひとことが変わっていれば
 * `notesToUpdate` に載せ、UPDATE で反映する。
 * リクエスト内の重複日付は先に現れた1件として扱う。
 */
export const diffCandidateDates = (
  existing: readonly { id: string; date: string; dateNote: string | null }[],
  requested: readonly CandidateDateEntry[],
): CandidateDateDiff => {
  const existingByDate = new Map(existing.map((entry) => [entry.date, entry]));

  // 重複日付は先勝ち。Map なので後勝ちにならないよう、既出の日付は上書きしない
  const requestedByDate = new Map<string, CandidateDateEntry>();
  for (const entry of requested) {
    if (!requestedByDate.has(entry.date)) {
      requestedByDate.set(entry.date, entry);
    }
  }

  const datesToAdd: CandidateDateEntry[] = [];
  const notesToUpdate: { id: string; dateNote: string | null }[] = [];

  for (const [date, entry] of requestedByDate) {
    const current = existingByDate.get(date);
    if (!current) {
      datesToAdd.push({ date, dateNote: entry.dateNote });
      continue;
    }
    if (current.dateNote !== entry.dateNote) {
      notesToUpdate.push({ id: current.id, dateNote: entry.dateNote });
    }
  }

  const dateIdsToRemove = existing
    .filter((entry) => !requestedByDate.has(entry.date))
    .map((entry) => entry.id);

  return { datesToAdd, dateIdsToRemove, notesToUpdate };
};
