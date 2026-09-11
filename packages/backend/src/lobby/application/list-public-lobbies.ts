import type { LobbyListItem } from '@taku-biyori/shared';

export interface ListPublicLobbiesRepository {
  findPublic(): Promise<LobbyListItem[]>;
}

/**
 * 公開ロビーの探索（design-v2 §6-2）。
 *
 * 公開済み（`publishedAt != null`）かつステータスが `open` のものだけを返す。
 * 未参加の人が遊べるロビーを探すための一覧なので、**未ログインでも取得できる**。
 * 自分がホスト・参加中のロビーは `listMyLobbies` で取る。
 */
export const listPublicLobbies = async (
  repo: ListPublicLobbiesRepository,
): Promise<LobbyListItem[]> => {
  return repo.findPublic();
};
