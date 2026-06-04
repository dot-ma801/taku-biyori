import type {
  GameSession,
  UpdateGameSessionStatusInput,
} from '@taku-biyori/shared';
import type { GameSessionHostRepository } from '@/game-session/application/game-session-host-repository';
import type { GameSessionStatusInput } from '@/game-session/domain/game-session-status';
import { getGameSessionStatus } from '@/game-session/domain/game-session-status';

export interface UpdateGameSessionStatusRepository extends GameSessionHostRepository {
  findStatusFields(id: string): Promise<GameSessionStatusInput | null>;
  publish(id: string): Promise<GameSession | null>;
  complete(id: string, completedAt: Date): Promise<GameSession | null>;
}

export type UpdateGameSessionStatusResult =
  | { type: 'ok'; gameSession: GameSession }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidTransition' };

export const updateGameSessionStatus = async (
  repo: UpdateGameSessionStatusRepository,
  id: string,
  userId: string,
  input: UpdateGameSessionStatusInput,
  now: Date = new Date(),
): Promise<UpdateGameSessionStatusResult> => {
  const hostUserId = await repo.findHostUserId(id);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const fields = await repo.findStatusFields(id);
  if (!fields) return { type: 'notFound' };

  const currentStatus = getGameSessionStatus(fields, now);

  if (input.status === 'open') {
    if (currentStatus !== 'draft') return { type: 'invalidTransition' };
    const gameSession = await repo.publish(id);
    if (!gameSession) return { type: 'notFound' };
    return { type: 'ok', gameSession };
  }

  if (input.status === 'completed') {
    if (currentStatus !== 'today') return { type: 'invalidTransition' };
    const gameSession = await repo.complete(id, now);
    if (!gameSession) return { type: 'notFound' };
    return { type: 'ok', gameSession };
  }

  return { type: 'invalidTransition' };
};
