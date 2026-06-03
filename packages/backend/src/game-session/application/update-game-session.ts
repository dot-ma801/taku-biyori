import type { GameSession, UpdateGameSessionInput } from '@taku-biyori/shared';

export interface UpdateGameSessionRepository {
  findHostUserId(id: string): Promise<string | null>;
  updateById(id: string, input: UpdateGameSessionInput): Promise<GameSession>;
}

export type UpdateGameSessionResult =
  | { type: 'ok'; gameSession: GameSession }
  | { type: 'notFound' }
  | { type: 'forbidden' };

export const updateGameSession = async (
  repo: UpdateGameSessionRepository,
  id: string,
  userId: string,
  input: UpdateGameSessionInput,
): Promise<UpdateGameSessionResult> => {
  const hostUserId = await repo.findHostUserId(id);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const gameSession = await repo.updateById(id, input);
  return { type: 'ok', gameSession };
};
