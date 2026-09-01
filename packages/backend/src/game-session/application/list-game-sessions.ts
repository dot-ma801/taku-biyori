import type { LegacyGameSessionListItem } from '@taku-biyori/shared';

export interface ListGameSessionsRepository {
  findByUserId(userId: string): Promise<LegacyGameSessionListItem[]>;
}

export const listGameSessions = async (
  repo: ListGameSessionsRepository,
  userId: string,
): Promise<LegacyGameSessionListItem[]> => {
  return repo.findByUserId(userId);
};
