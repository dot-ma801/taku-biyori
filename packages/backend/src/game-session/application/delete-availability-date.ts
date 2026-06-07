import type { GameSessionHostRepository } from '@/game-session/application/game-session-host-repository';

export interface DeleteAvailabilityDateRepository extends GameSessionHostRepository {
  findCandidateOwner(dateId: string): Promise<{ gameSessionId: string } | null>;
  deleteDateById(dateId: string): Promise<void>;
}

export type DeleteAvailabilityDateResult =
  | { type: 'ok' }
  | { type: 'notFound' }
  | { type: 'forbidden' };

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

  await repo.deleteDateById(dateId);
  return { type: 'ok' };
};
