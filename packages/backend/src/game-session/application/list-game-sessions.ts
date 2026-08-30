import type { GameSessionListItem } from '@taku-biyori/shared';

export interface ListGameSessionsRepository {
  findByUserId(userId: string): Promise<GameSessionListItem[]>;
}

/**
 * ダッシュボードの横断一覧（GET /api/me/game-sessions）。
 *
 * 複数のロビーをまたぐため、このエンドポイントだけは入れ子にしない（design-v2 §6-5）。
 * 絞り込みはフロントで行うので、ここでは条件を足さない。
 */
export const listGameSessions = async (
  repo: ListGameSessionsRepository,
  userId: string,
): Promise<GameSessionListItem[]> => {
  return repo.findByUserId(userId);
};
