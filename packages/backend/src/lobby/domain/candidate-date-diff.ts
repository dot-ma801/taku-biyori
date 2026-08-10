/** DB 上の既存候補日 */
export interface ExistingCandidateDate {
  id: string;
  date: string;
  timeNote?: string | null;
}

/** リクエストされた候補日（timeNote 省略は「なし」と同義） */
export interface RequestedCandidateDate {
  date: string;
  timeNote?: string | null;
}

export interface CandidateDateDiff {
  datesToAdd: { date: string; timeNote: string | null }[];
  dateIdsToRemove: string[];
  notesToUpdate: { id: string; timeNote: string | null }[];
}

/** 省略・null を同じ「未入力」に揃える */
const normalizeTimeNote = (
  timeNote: string | null | undefined,
): string | null => timeNote ?? null;

/**
 * 候補日の一括更新で適用すべき差分を計算する。
 *
 * 既存とリクエストの両方にある日付は行を保持する（行を保つことで、
 * その候補日に紐づく回答をカスケード削除から守る）。
 * このとき時刻メモだけが変わっていれば `notesToUpdate` として UPDATE 対象にする。
 * ここを delete + insert で実装すると回答が巻き添えで消えるため、必ず更新として扱うこと。
 *
 * リクエスト内に同じ日付が複数あれば後勝ちで 1 件に丸める。
 */
export const diffCandidateDates = (
  existing: readonly ExistingCandidateDate[],
  requested: readonly RequestedCandidateDate[],
): CandidateDateDiff => {
  // 後勝ちで重複を丸める
  const requestedByDate = new Map<string, string | null>();
  for (const entry of requested) {
    requestedByDate.set(entry.date, normalizeTimeNote(entry.timeNote));
  }

  const existingByDate = new Map(existing.map((entry) => [entry.date, entry]));

  const datesToAdd: CandidateDateDiff['datesToAdd'] = [];
  const notesToUpdate: CandidateDateDiff['notesToUpdate'] = [];

  for (const [date, timeNote] of requestedByDate) {
    const current = existingByDate.get(date);
    if (!current) {
      datesToAdd.push({ date, timeNote });
      continue;
    }
    if (normalizeTimeNote(current.timeNote) !== timeNote) {
      notesToUpdate.push({ id: current.id, timeNote });
    }
  }

  const dateIdsToRemove = existing
    .filter((entry) => !requestedByDate.has(entry.date))
    .map((entry) => entry.id);

  return { datesToAdd, dateIdsToRemove, notesToUpdate };
};
