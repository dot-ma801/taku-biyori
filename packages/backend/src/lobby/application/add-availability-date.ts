import type {
  LobbyAvailabilityDate,
  CreateLobbyAvailabilityDateInput,
} from '@taku-biyori/shared';
import type { LobbyHostRepository } from '@/lobby/application/lobby-host-repository';
import type { LobbyStatusInput } from '@/lobby/domain/lobby-status';
import {
  EDITABLE_CANDIDATE_STATUSES,
  getLobbyStatus,
} from '@/lobby/domain/lobby-status';

export interface AddAvailabilityDateRepository extends LobbyHostRepository {
  findStatusFields(id: string): Promise<LobbyStatusInput | null>;
  addDate(
    lobbyId: string,
    date: string,
    timeNote: string | null,
  ): Promise<LobbyAvailabilityDate>;
}

export type AddAvailabilityDateResult =
  | { type: 'ok'; date: LobbyAvailabilityDate }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' };

export const addAvailabilityDate = async (
  repo: AddAvailabilityDateRepository,
  lobbyId: string,
  userId: string,
  input: CreateLobbyAvailabilityDateInput,
): Promise<AddAvailabilityDateResult> => {
  const hostUserId = await repo.findHostUserId(lobbyId);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const fields = await repo.findStatusFields(lobbyId);
  if (!fields) return { type: 'notFound' };
  if (!EDITABLE_CANDIDATE_STATUSES.has(getLobbyStatus(fields)))
    return { type: 'invalidStatus' };

  const date = await repo.addDate(lobbyId, input.date, input.timeNote ?? null);
  return { type: 'ok', date };
};
