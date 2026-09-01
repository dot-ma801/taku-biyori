import type {
  LegacyGameSession,
  LegacyUpdateGameSessionInput,
} from '@taku-biyori/shared';
import type { GameSessionHostRepository } from '@/game-session/application/game-session-host-repository';

export interface UpdateGameSessionRepository extends GameSessionHostRepository {
  updateById(
    id: string,
    input: LegacyUpdateGameSessionInput,
  ): Promise<LegacyGameSession | null>;
}

export type UpdateGameSessionResult =
  | { type: 'ok'; gameSession: LegacyGameSession }
  | { type: 'notFound' }
  | { type: 'forbidden' };

export const updateGameSession = async (
  repo: UpdateGameSessionRepository,
  id: string,
  userId: string,
  input: LegacyUpdateGameSessionInput,
): Promise<UpdateGameSessionResult> => {
  const hostUserId = await repo.findHostUserId(id);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const gameSession = await repo.updateById(id, input);
  if (!gameSession) return { type: 'notFound' };
  return { type: 'ok', gameSession };
};
