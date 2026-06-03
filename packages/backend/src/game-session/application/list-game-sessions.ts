import type { GameSessionListItem } from '@taku-biyori/shared';

export interface ListGameSessionsRepository {
  findByUserId(userId: string): Promise<GameSessionListItem[]>;
}

export const listGameSessions = async (
  repo: ListGameSessionsRepository,
  userId: string,
): Promise<GameSessionListItem[]> => {
  return repo.findByUserId(userId);
};
