import type { LobbyListItem } from '@taku-biyori/shared';

export interface ListMyLobbiesRepository {
  findByUserId(userId: string): Promise<LobbyListItem[]>;
}

/**
 * 自分のロビー一覧（design-v2 §6-2）。
 *
 * ホスト、または在籍中の参加者であるロビーだけを返す。下書き・解散済みも含み、
 * 絞り込みは呼び出し側（ダッシュボードの4セクション）が行う。
 * 公開ロビーの探索は `listPublicLobbies` の担当で、用途が違うので混ぜない。
 */
export const listMyLobbies = async (
  repo: ListMyLobbiesRepository,
  userId: string,
): Promise<LobbyListItem[]> => {
  return repo.findByUserId(userId);
};
