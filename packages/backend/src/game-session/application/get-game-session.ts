import type { GameSessionDetail } from '@taku-biyori/shared';

export interface GetGameSessionRepository {
  findDetailById(id: string): Promise<GameSessionDetail | null>;
}

export const getGameSession = async (
  repo: GetGameSessionRepository,
  id: string,
): Promise<GameSessionDetail | null> => {
  return repo.findDetailById(id);
};
