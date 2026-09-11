import type { LobbyEntry, JoinLobbyInput } from '@taku-biyori/shared';
import {
  LobbyStatus,
  LobbyAction,
  canPerformLobbyAction,
} from '@taku-biyori/shared';

export interface JoinLobbyRepository {
  // null はロビーが存在しないことを表す
  findLobbyStatus(id: string): Promise<LobbyStatus | null>;
  /** 脱退済みも含めて既存の参加を引く。再参加の判定に使う */
  findEntryByUserId(
    lobbyId: string,
    userId: string,
  ): Promise<{ id: string; leftAt: Date | null } | null>;
  /** `left_at` を NULL に戻して復帰させる。すでに在籍中なら null */
  rejoinEntry(entryId: string): Promise<LobbyEntry | null>;
  // null は DB 一意制約違反（同時リクエストによる重複）を表す
  addEntry(
    lobbyId: string,
    userId: string,
    input: JoinLobbyInput,
  ): Promise<LobbyEntry | null>;
}

export type JoinLobbyResult =
  | { type: 'ok'; entry: LobbyEntry }
  | { type: 'notFound' }
  | { type: 'lobbyNotOpen' }
  | { type: 'alreadyJoined' };

/**
 * ロビーに参加する。
 *
 * 脱退済みの行が残っている場合は**新しい行を作らず `left_at` を NULL に戻す**。
 * partial unique index が `left_at` を条件に含めないため新規 INSERT はできず、
 * また過去の回答・着席・メモを繋いだまま復帰させたいため（design-v2 §3-3）。
 */
export const joinLobby = async (
  repo: JoinLobbyRepository,
  lobbyId: string,
  userId: string,
  input: JoinLobbyInput,
): Promise<JoinLobbyResult> => {
  // null はロビー非存在として扱い、クエリを1回に統合する
  const status = await repo.findLobbyStatus(lobbyId);
  if (status === null) return { type: 'notFound' };
  if (!canPerformLobbyAction(LobbyAction.joinLobby, status, 'member')) {
    return { type: 'lobbyNotOpen' };
  }

  const existing = await repo.findEntryByUserId(lobbyId, userId);
  if (existing !== null) {
    if (existing.leftAt === null) return { type: 'alreadyJoined' };

    const rejoined = await repo.rejoinEntry(existing.id);
    // 並行リクエストに先を越された（すでに復帰済み）
    if (rejoined === null) return { type: 'alreadyJoined' };
    return { type: 'ok', entry: rejoined };
  }

  const entry = await repo.addEntry(lobbyId, userId, input);
  // DB 一意制約違反（同時リクエスト）
  if (entry === null) return { type: 'alreadyJoined' };

  return { type: 'ok', entry };
};
