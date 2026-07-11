import type {
  LobbyAvailabilityDate,
  BulkUpdateLobbyAvailabilityDatesInput,
} from '@taku-biyori/shared';
import type { LobbyHostRepository } from '@/lobby/application/lobby-host-repository';
import type { LobbyStatusInput } from '@/lobby/domain/lobby-status';
import {
  EDITABLE_CANDIDATE_STATUSES,
  getLobbyStatus,
} from '@/lobby/domain/lobby-status';

export interface BulkUpdateAvailabilityDatesRepository extends LobbyHostRepository {
  findStatusFields(id: string): Promise<LobbyStatusInput | null>;
  replaceAllDates(
    lobbyId: string,
    dates: string[],
  ): Promise<LobbyAvailabilityDate[]>;
}

export type BulkUpdateAvailabilityDatesResult =
  | { type: 'ok'; dates: LobbyAvailabilityDate[] }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' };

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

  const dates = await repo.replaceAllDates(lobbyId, input.dates);
  return { type: 'ok', dates };
};
