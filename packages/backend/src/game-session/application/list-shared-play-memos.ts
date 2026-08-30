import type {
  GameSessionStatusFacts,
  LobbyStatus,
  SharedGameSessionPlayMemo,
} from '@taku-biyori/shared';
import {
  LobbyStatus as LobbyStatusEnum,
  canViewSharedPlayMemos,
  getGameSessionStatus,
  todayDateString,
} from '@taku-biyori/shared';

export interface ListSharedPlayMemosRepository {
  findLobbyId(id: string): Promise<string | null>;
  findLobbyForViewing(
    lobbyId: string,
  ): Promise<{ hostUserId: string; status: LobbyStatus } | null>;
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
 * 卓の公開済みプレイメモを一覧する（design-v1.2 §4・§5）。
 *
 * 返す内容は「卓が完了・中止 かつ shared_at != null」だけで決まり、**閲覧者に依存しない**。
 * 閲覧者自身の公開メモも含めて返す（分岐のある権限フィルタは漏洩バグの温床になるため、
 * 「自分のを除く」のような閲覧者による分岐を作らない）。
 *
 * ⚠️ **ロビーの公開制御を先に噛ませる点が要。** 公開はロビーの関心事に移ったので
 * 判定材料は lobby.status になった（design-v2 §4-2）。下書きのまま中止された開催は
 * セッション側では `cancelled` に導出されるため、素朴に「完了・中止ならメモを返す」と
 * 書くと下書きロビーのメモが第三者に読めてしまう。
 */
export const listSharedPlayMemos = async (
  repo: ListSharedPlayMemosRepository,
  gameSessionId: string,
  userId: string | null,
  today: string = todayDateString(),
): Promise<ListSharedPlayMemosResult> => {
  const fields = await repo.findStatusFields(gameSessionId);
  if (!fields) return { type: 'notFound' };

  const lobbyId = await repo.findLobbyId(gameSessionId);
  if (lobbyId === null) return { type: 'notFound' };

  // 閲覧制御は getGameSession と同一に保つ（design-v1.2 §4 手順2）
  const lobby = await repo.findLobbyForViewing(lobbyId);
  if (!lobby) return { type: 'notFound' };

  if (lobby.status === LobbyStatusEnum.draft) {
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
