import type { GameSession } from '@taku-biyori/shared';
import type { GameSessionHostRepository } from '@/game-session/application/game-session-host-repository';

export interface ConfirmAvailabilityDateRepository extends GameSessionHostRepository {
  findCandidateOwner(
    dateId: string,
  ): Promise<{ gameSessionId: string; date: string } | null>;
  setScheduledAt(
    gameSessionId: string,
    date: string,
  ): Promise<GameSession | null>;
}

export type ConfirmAvailabilityDateResult =
  | { type: 'ok'; gameSession: GameSession }
  | { type: 'notFound' }
  | { type: 'forbidden' };

export const confirmAvailabilityDate = async (
  repo: ConfirmAvailabilityDateRepository,
  dateId: string,
  userId: string,
): Promise<ConfirmAvailabilityDateResult> => {
  const candidate = await repo.findCandidateOwner(dateId);
  if (!candidate) return { type: 'notFound' };

  const hostUserId = await repo.findHostUserId(candidate.gameSessionId);
  if (!hostUserId) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const gameSession = await repo.setScheduledAt(
    candidate.gameSessionId,
    candidate.date,
  );
  if (!gameSession) return { type: 'notFound' };
  return { type: 'ok', gameSession };
};
