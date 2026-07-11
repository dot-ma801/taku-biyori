import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyHostRepository } from '@/lobby/application/lobby-host-repository';
import type { LobbyStatusInput } from '@/lobby/domain/lobby-status';
import { getLobbyStatus } from '@/lobby/domain/lobby-status';

const ALLOWED_STATUSES = new Set<LobbyStatus>([
  LobbyStatus.draft,
  LobbyStatus.open,
  LobbyStatus.scheduling,
]);

export interface DeleteAvailabilityDateRepository extends LobbyHostRepository {
  findStatusFields(id: string): Promise<LobbyStatusInput | null>;
  findCandidateOwner(dateId: string): Promise<{ lobbyId: string } | null>;
  deleteDateById(dateId: string): Promise<void>;
}

export type DeleteAvailabilityDateResult =
  | { type: 'ok' }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' };

export const deleteAvailabilityDate = async (
  repo: DeleteAvailabilityDateRepository,
  lobbyId: string,
  dateId: string,
  userId: string,
): Promise<DeleteAvailabilityDateResult> => {
  const candidate = await repo.findCandidateOwner(dateId);
  if (!candidate) return { type: 'notFound' };
  if (candidate.lobbyId !== lobbyId) return { type: 'notFound' };

  const hostUserId = await repo.findHostUserId(candidate.lobbyId);
  if (!hostUserId) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const fields = await repo.findStatusFields(candidate.lobbyId);
  if (!fields) return { type: 'notFound' };
  if (!ALLOWED_STATUSES.has(getLobbyStatus(fields)))
    return { type: 'invalidStatus' };

  await repo.deleteDateById(dateId);
  return { type: 'ok' };
};
