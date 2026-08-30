/** 候補日1件分の「あるべき状態」。日付と、その日に添える時間帯（自由記述） */
export interface CandidateDateEntry {
  date: string;
  timeLabel: string | null;
}

export interface CandidateDateDiff {
  datesToAdd: CandidateDateEntry[];
  dateIdsToRemove: string[];
  /** 日付は残るが時間帯だけ変わった行 */
  timeLabelsToUpdate: { id: string; timeLabel: string | null }[];
}

/**
 * 候補日の一括更新で適用すべき差分を計算する。
 *
 * 既存とリクエストの両方にある日付は削除・再作成せず行を保持する（行 ID が変わると
 * その候補日に紐づく回答が cascade で消えるため）。保持する行の時間帯が変わっていれば
 * `timeLabelsToUpdate` に載せ、UPDATE で反映する。
 * リクエスト内の重複日付は先に現れた1件として扱う。
 */
export const diffCandidateDates = (
  existing: readonly { id: string; date: string; timeLabel: string | null }[],
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
  const timeLabelsToUpdate: { id: string; timeLabel: string | null }[] = [];

  for (const [date, entry] of requestedByDate) {
    const current = existingByDate.get(date);
    if (!current) {
      datesToAdd.push({ date, timeLabel: entry.timeLabel });
      continue;
    }
    if (current.timeLabel !== entry.timeLabel) {
      timeLabelsToUpdate.push({ id: current.id, timeLabel: entry.timeLabel });
    }
  }

  const dateIdsToRemove = existing
    .filter((entry) => !requestedByDate.has(entry.date))
    .map((entry) => entry.id);

  return { datesToAdd, dateIdsToRemove, timeLabelsToUpdate };
};
