import { GameSessionStatus } from '@taku-biyori/shared';
import type { GameSessionHostRepository } from '@/game-session/application/game-session-host-repository';
import type { GameSessionStatusInput } from '@/game-session/domain/game-session-status';
import { getGameSessionStatus } from '@/game-session/domain/game-session-status';

const ALLOWED_STATUSES = new Set<GameSessionStatus>([
  GameSessionStatus.draft,
  GameSessionStatus.open,
  GameSessionStatus.scheduling,
]);

export interface DeleteAvailabilityDateRepository extends GameSessionHostRepository {
  findStatusFields(id: string): Promise<GameSessionStatusInput | null>;
  findCandidateOwner(dateId: string): Promise<{ gameSessionId: string } | null>;
  deleteDateById(dateId: string): Promise<void>;
}

export type DeleteAvailabilityDateResult =
  | { type: 'ok' }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'conflict' };

export const deleteAvailabilityDate = async (
  repo: DeleteAvailabilityDateRepository,
  gameSessionId: string,
  dateId: string,
  userId: string,
): Promise<DeleteAvailabilityDateResult> => {
  const candidate = await repo.findCandidateOwner(dateId);
  if (!candidate) return { type: 'notFound' };
  if (candidate.gameSessionId !== gameSessionId) return { type: 'notFound' };

  const hostUserId = await repo.findHostUserId(candidate.gameSessionId);
  if (!hostUserId) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const fields = await repo.findStatusFields(candidate.gameSessionId);
  if (!fields) return { type: 'notFound' };
  if (!ALLOWED_STATUSES.has(getGameSessionStatus(fields)))
    return { type: 'conflict' };

  await repo.deleteDateById(dateId);
  return { type: 'ok' };
};
