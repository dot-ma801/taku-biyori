import type {
  GameSessionStatusFacts,
  SharedGameSessionPlayMemo,
} from '@taku-biyori/shared';
import {
  canViewSharedPlayMemos,
  getGameSessionStatus,
  todayDateString,
} from '@taku-biyori/shared';

export interface ListSharedPlayMemosRepository {
  findLobbyId(id: string): Promise<string | null>;
  findLobbyForViewing(
    lobbyId: string,
  ): Promise<{ hostUserId: string; publishedAt: Date | null } | null>;
  findStatusFields(id: string): Promise<GameSessionStatusFacts | null>;
  findSharedPlayMemos(
    gameSessionId: string,
  ): Promise<SharedGameSessionPlayMemo[]>;
}

export type ListSharedPlayMemosResult =
  | { type: 'ok'; playMemos: SharedGameSessionPlayMemo[] }
  | { type: 'notFound' }
  | { type: 'forbidden' };

/**
 * 開催の公開済みプレイメモを一覧する。
 *
 * レスポンス契約は v2 でも据え置き（design-v2 §6-15）。閲覧可否は design-v2 §4-3、
 * 当時のエラー表の詳細は design-v1.2 §4・§5 が記録として残っている。
 *
 * 返す内容は「開催が完了・中止 かつ shared_at != null」だけで決まり、**閲覧者に依存しない**。
 * 閲覧者自身の公開メモも含めて返す（分岐のある権限フィルタは漏洩バグの温床になるため、
 * 「自分のを除く」のような閲覧者による分岐を作らない）。
 *
 * ⚠️ **ロビーの公開制御を先に噛ませる点が要。** 公開はロビーの関心事に移ったので
 * 判定材料はロビーの `published_at` になった（design-v2 §4-2 / §6-13-4）。未公開のまま中止された開催は
 * セッション側では `cancelled` に導出されるため、素朴に「完了・中止ならメモを返す」と
 * 書くと下書きロビーのメモが第三者に読めてしまう。
 */
export const listSharedPlayMemos = async (
  repo: ListSharedPlayMemosRepository,
  lobbyId: string,
  gameSessionId: string,
  userId: string | null,
  today: string = todayDateString(),
): Promise<ListSharedPlayMemosResult> => {
  const fields = await repo.findStatusFields(gameSessionId);
  if (!fields) return { type: 'notFound' };

  // URL のロビーがこの開催のロビーでなければ 404（入れ子のパスは親も検証する）
  const actualLobbyId = await repo.findLobbyId(gameSessionId);
  if (actualLobbyId === null || actualLobbyId !== lobbyId) {
    return { type: 'notFound' };
  }

  // 閲覧制御は getGameSession と同一に保つ（design-v1.2 §4 手順2）
  const lobby = await repo.findLobbyForViewing(lobbyId);
  if (!lobby) return { type: 'notFound' };

  // 導出ステータスではなく published_at で判定する（design-v2 §6-13-4）。
  // 一度も公開せずに解散したロビーは status が disbanded になるため、
  // status で判定すると未公開のメモが第三者に読めてしまう
  if (lobby.publishedAt === null) {
    // 未ログイン（userId === null）は決してホストになりえない。
    // userId === null を先に弾かないと「未ログイン同士の null 一致」で素通りしてしまう
    if (userId === null || lobby.hostUserId !== userId) {
      return { type: 'forbidden' };
    }
  }

  const status = getGameSessionStatus(fields, today);
  if (!canViewSharedPlayMemos(status)) return { type: 'ok', playMemos: [] };

  const playMemos = await repo.findSharedPlayMemos(gameSessionId);
  return { type: 'ok', playMemos };
};
