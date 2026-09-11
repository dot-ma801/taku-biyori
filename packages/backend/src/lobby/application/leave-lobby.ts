import {
  LobbyStatus,
  LobbyAction,
  canPerformLobbyAction,
} from '@taku-biyori/shared';

export interface LeaveLobbyRepository {
  findEntryOwner(entryId: string): Promise<{
    lobbyId: string;
    userId: string | null;
    leftAt: Date | null;
  } | null>;
  findHostUserId(id: string): Promise<string | null>;
  findLobbyStatus(id: string): Promise<LobbyStatus | null>;
  /** 脱退は `left_at` をセットするだけ。行は消さない（design-v2 §9-5） */
  markEntryLeft(entryId: string): Promise<void>;
}

export type LeaveLobbyResult =
  | { type: 'ok' }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'hostCannotLeave' }
  | { type: 'invalidStatus' };

/**
 * ロビーから脱退する（本人、またはホストによる取り消し）。
 *
 * **行は削除せず `left_at` をセットする。** Seat・回答・プレイメモが参照しているため、
 * 削除すると過去の開催記録が壊れる（design-v2 §9-5）。
 * 再参加は同じ行の `left_at` を NULL に戻す（join-lobby 参照）。
 */
export const leaveLobby = async (
  repo: LeaveLobbyRepository,
  lobbyId: string,
  entryId: string,
  userId: string,
): Promise<LeaveLobbyResult> => {
  const owner = await repo.findEntryOwner(entryId);
  if (!owner || owner.lobbyId !== lobbyId) {
    return { type: 'notFound' };
  }

  // すでに脱退済みの行は対象にしない（二重脱退で left_at を上書きしない）
  if (owner.leftAt !== null) return { type: 'notFound' };

  const status = await repo.findLobbyStatus(lobbyId);
  if (
    status === null ||
    !canPerformLobbyAction(LobbyAction.leaveLobby, status, 'member')
  ) {
    return { type: 'invalidStatus' };
  }

  const hostUserId = await repo.findHostUserId(lobbyId);
  const isHost = hostUserId === userId;
  const isSelf = owner.userId === userId;

  // 本人性はロールとステータスの2軸で表せないため、ここで判定する（design-v2 §4-5）
  if (!isHost && !isSelf) return { type: 'forbidden' };

  // ホスト自身の参加は脱退不可（design-v2 §4-3）
  if (owner.userId === hostUserId) return { type: 'hostCannotLeave' };

  await repo.markEntryLeft(entryId);
  return { type: 'ok' };
};
