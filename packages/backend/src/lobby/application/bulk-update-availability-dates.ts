import type {
  LobbyAvailabilityDate,
  BulkUpdateLobbyAvailabilityDatesInput,
} from '@taku-biyori/shared';
import {
  LobbyAction,
  canPerformLobbyAction,
  getLobbyStatus,
  normalizeDateNote,
  type LobbyStatusFacts,
} from '@taku-biyori/shared';
import type { LobbyHostRepository } from '@/lobby/application/lobby-host-repository';
import type { CandidateDateDiff } from '@/lobby/domain/candidate-date-diff';
import { diffCandidateDates } from '@/lobby/domain/candidate-date-diff';

export interface BulkUpdateAvailabilityDatesRepository extends LobbyHostRepository {
  findStatusFields(id: string): Promise<LobbyStatusFacts | null>;
  findByLobbyId(lobbyId: string): Promise<LobbyAvailabilityDate[]>;
  /** 差分を1トランザクションで適用する（追加・削除と、残る行のひとこと更新） */
  applyDateChanges(lobbyId: string, diff: CandidateDateDiff): Promise<void>;
  /**
   * 対象募集枠行に排他ロックを取り、差分計算（読み取り）〜適用（書き込み）までを
   * 1トランザクションで実行する。読み取りと書き込みを別トランザクションに分けると、
   * 並行リクエストが同じ「あるべき状態」を根拠に競合する候補日を追加し、
   * `lobby_candidates_lobby_id_date_unique` 違反を招く TOCTOU が起きるため
   * （既存の delete-lobby / confirm-lobby と同方針）。
   */
  executeWithLock<T>(
    lobbyId: string,
    fn: (lockedRepo: BulkUpdateAvailabilityDatesRepository) => Promise<T>,
  ): Promise<T>;
}

export type BulkUpdateAvailabilityDatesResult =
  | { type: 'ok'; dates: LobbyAvailabilityDate[] }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' };

/**
 * 候補日の一括更新。リクエストの日付リストを「あるべき状態」として差分適用する。
 *
 * 既存とリクエストの両方にある日付は行を保持するため、
 * その候補日に付いたメンバーの回答（◯△×）は消えない。ひとことだけが変わった場合も
 * 行を作り直さず UPDATE で反映するので、回答は保持される。
 * リクエストから外れた候補日は削除され、紐づく回答もカスケード削除される（意図どおり）。
 */
export const bulkUpdateAvailabilityDates = async (
  repo: BulkUpdateAvailabilityDatesRepository,
  lobbyId: string,
  userId: string,
  input: BulkUpdateLobbyAvailabilityDatesInput,
): Promise<BulkUpdateAvailabilityDatesResult> => {
  return repo.executeWithLock(lobbyId, async (locked) => {
    const hostUserId = await locked.findHostUserId(lobbyId);
    if (hostUserId === null) return { type: 'notFound' };
    if (hostUserId !== userId) return { type: 'forbidden' };

    const fields = await locked.findStatusFields(lobbyId);
    if (!fields) return { type: 'notFound' };
    const status = getLobbyStatus(fields);
    if (!canPerformLobbyAction(LobbyAction.editCandidateDates, status, 'host'))
      return { type: 'invalidStatus' };

    const existing = await locked.findByLobbyId(lobbyId);
    // ひとことは空白のみを null に寄せてから差分を取る
    // （「空文字にした」だけの更新を差分として拾わないため）
    const requested = input.dates.map((entry) => ({
      date: entry.date,
      dateNote: normalizeDateNote(entry.dateNote),
    }));
    const diff = diffCandidateDates(existing, requested);

    if (
      diff.datesToAdd.length === 0 &&
      diff.dateIdsToRemove.length === 0 &&
      diff.notesToUpdate.length === 0
    ) {
      return { type: 'ok', dates: existing };
    }

    await locked.applyDateChanges(lobbyId, diff);
    const dates = await locked.findByLobbyId(lobbyId);
    return { type: 'ok', dates };
  });
};
