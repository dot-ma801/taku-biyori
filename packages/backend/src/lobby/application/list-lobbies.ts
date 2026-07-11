import type { LobbyListItem } from '@taku-biyori/shared';

export interface ListLobbiesRepository {
  findByUserId(userId: string): Promise<LobbyListItem[]>;
}

export const listLobbies = async (
  repo: ListLobbiesRepository,
  userId: string,
): Promise<LobbyListItem[]> => {
  return repo.findByUserId(userId);
};
