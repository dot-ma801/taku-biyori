import type { GameSessionDetail } from '@taku-biyori/shared';

export interface GetGameSessionRepository {
  findDetailById(id: string): Promise<GameSessionDetail | null>;
}

export type GetGameSessionResult =
  | { type: 'ok'; gameSession: GameSessionDetail }
  | { type: 'notFound' }
  | { type: 'forbidden' };

export const getGameSession = async (
  repo: GetGameSessionRepository,
  id: string,
  userId: string | null,
): Promise<GetGameSessionResult> => {
  const gameSession = await repo.findDetailById(id);
  if (!gameSession) return { type: 'notFound' };

  if (!gameSession.isPublished && gameSession.createdBy !== userId) {
    return { type: 'forbidden' };
  }

  return { type: 'ok', gameSession };
};
