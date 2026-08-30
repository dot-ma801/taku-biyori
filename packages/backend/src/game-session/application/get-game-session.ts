import type { GameSessionDetail } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';

export interface GetGameSessionRepository {
  findDetailById(id: string): Promise<GameSessionDetail | null>;
}

export type GetGameSessionResult =
  | { type: 'ok'; gameSession: GameSessionDetail }
  | { type: 'notFound' }
  | { type: 'forbidden' };

/**
 * セッションの詳細を取得する（design-v2 §6-13-5）。
 *
 * 閲覧可否は**セッションではなく所属ロビー**が決める。セッションから公開の概念が
 * 消えたため（§4-2）、判定材料は lobby.status だけになった。
 *
 * **解決済みの表示値は組み立てない。** 上書きの生値（overrides）とロビーの既定値（lobby）を
 * そのまま返し、解決はクライアントが `resolveGameSessionDisplay()` で行う（§5-5）。
 */
export const getGameSession = async (
  repo: GetGameSessionRepository,
  lobbyId: string,
  id: string,
  userId: string | null,
): Promise<GetGameSessionResult> => {
  const gameSession = await repo.findDetailById(id);
  if (!gameSession) return { type: 'notFound' };

  // 入れ子パスの代償。URL の :lobbyId が実際の所属と違うリクエストは、
  // 存在を漏らさないよう 404 にする（design-v2 §6-5）
  if (gameSession.lobbyId !== lobbyId) return { type: 'notFound' };

  // 下書きのロビーはホストにしか見せない。公開後は解散していても見える
  // （終わった企画の記録は残る。§4-4）
  const isDraft = gameSession.lobby.status === LobbyStatus.draft;
  if (isDraft && gameSession.lobby.hostUserId !== userId) {
    return { type: 'forbidden' };
  }

  return { type: 'ok', gameSession };
};
