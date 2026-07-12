import type {
  LobbyAvailabilityDate,
  BulkUpdateLobbyAvailabilityDatesInput,
} from '@taku-biyori/shared';
import type { LobbyHostRepository } from '@/lobby/application/lobby-host-repository';
import type { LobbyStatusInput } from '@/lobby/domain/lobby-status';
import type { CandidateDateDiff } from '@/lobby/domain/candidate-date-diff';
import { diffCandidateDates } from '@/lobby/domain/candidate-date-diff';
import {
  EDITABLE_CANDIDATE_STATUSES,
  getLobbyStatus,
} from '@/lobby/domain/lobby-status';

export interface BulkUpdateAvailabilityDatesRepository extends LobbyHostRepository {
  findStatusFields(id: string): Promise<LobbyStatusInput | null>;
  findByLobbyId(lobbyId: string): Promise<LobbyAvailabilityDate[]>;
  /** 差分を1トランザクションで適用する（追加と削除のみ。残る行は触らない） */
  applyDateChanges(lobbyId: string, diff: CandidateDateDiff): Promise<void>;
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
 * その候補日に付いたメンバーの回答（◯△×）は消えない。
 * リクエストから外れた候補日は削除され、紐づく回答もカスケード削除される（意図どおり）。
 */
export const bulkUpdateAvailabilityDates = async (
  repo: BulkUpdateAvailabilityDatesRepository,
  lobbyId: string,
  userId: string,
  input: BulkUpdateLobbyAvailabilityDatesInput,
): Promise<BulkUpdateAvailabilityDatesResult> => {
  const hostUserId = await repo.findHostUserId(lobbyId);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const fields = await repo.findStatusFields(lobbyId);
  if (!fields) return { type: 'notFound' };
  if (!EDITABLE_CANDIDATE_STATUSES.has(getLobbyStatus(fields)))
    return { type: 'invalidStatus' };

  const existing = await repo.findByLobbyId(lobbyId);
  const diff = diffCandidateDates(existing, input.dates);

  if (diff.datesToAdd.length === 0 && diff.dateIdsToRemove.length === 0) {
    return { type: 'ok', dates: existing };
  }

  await repo.applyDateChanges(lobbyId, diff);
  const dates = await repo.findByLobbyId(lobbyId);
  return { type: 'ok', dates };
};
