import type { GameSessionHostRepository } from '@/game-session/application/game-session-host-repository';

export interface DeleteGameSessionRepository extends GameSessionHostRepository {
  deleteById(id: string): Promise<void>;
}

export type DeleteGameSessionResult =
  | { type: 'ok' }
  | { type: 'notFound' }
  | { type: 'forbidden' };

export const deleteGameSession = async (
  repo: DeleteGameSessionRepository,
  id: string,
  userId: string,
): Promise<DeleteGameSessionResult> => {
  const hostUserId = await repo.findHostUserId(id);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  await repo.deleteById(id);
  return { type: 'ok' };
};
