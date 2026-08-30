import type { LegacyGameSessionDetail } from '@taku-biyori/shared';

export interface GetGameSessionRepository {
  findDetailById(id: string): Promise<LegacyGameSessionDetail | null>;
}

export type GetGameSessionResult =
  | { type: 'ok'; gameSession: LegacyGameSessionDetail }
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
