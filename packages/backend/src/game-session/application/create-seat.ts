import type {
  CreateSeatInput,
  GameSessionStatusFacts,
  Seat,
} from '@taku-biyori/shared';
import {
  GameSessionAction,
  canPerform,
  getGameSessionStatus,
} from '@taku-biyori/shared';

export interface CreateSeatRepository {
  findLobbyId(id: string): Promise<string | null>;
  findHostUserId(id: string): Promise<string | null>;
  findStatusFields(id: string): Promise<GameSessionStatusFacts | null>;
  /** 在籍中（left_at IS NULL）の LobbyEntry のロビー ID。脱退済み・不在なら null */
  findEntryLobbyId(entryId: string): Promise<string | null>;
  /** null は unique 制約違反（すでに着席済み）を表す */
  addSeat(gameSessionId: string, lobbyEntryId: string): Promise<Seat | null>;
}

export type CreateSeatResult =
  | { type: 'ok'; seat: Seat }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' }
  | { type: 'invalidEntry' }
  | { type: 'alreadySeated' };

/**
 * ホストが指定した LobbyEntry を着席させる（design-v2 §6-6）。
 *
 * **着席させられるのはホストだけ。** 着席は選出のファクトであり、選出はホストの仕事である。
 * ログインユーザーもゲストも自分の操作は「ロビーに参加する」までで、
 * v0.2 の「自分で着席する」経路とゲストの「参加 + 着席」はどちらも廃止した。
 */
export const createSeat = async (
  repo: CreateSeatRepository,
  lobbyId: string,
  gameSessionId: string,
  userId: string,
  input: CreateSeatInput,
): Promise<CreateSeatResult> => {
  const actualLobbyId = await repo.findLobbyId(gameSessionId);
  if (actualLobbyId === null) return { type: 'notFound' };
  if (actualLobbyId !== lobbyId) return { type: 'notFound' };

  const hostUserId = await repo.findHostUserId(gameSessionId);
  if (hostUserId !== userId) return { type: 'forbidden' };

  const facts = await repo.findStatusFields(gameSessionId);
  if (!facts) return { type: 'notFound' };

  const status = getGameSessionStatus(facts);
  if (!canPerform(GameSessionAction.seatEntry, status, 'host')) {
    return { type: 'invalidStatus' };
  }

  // seats.lobby_entry_id のロビーと game_sessions.lobby_id の一致は
  // 単純な FK では表現できない不変条件なのでここで検証する（design-v2 §3-8）。
  // 脱退済みの entry もここで弾かれる（findEntryLobbyId が left_at で絞るため）
  const entryLobbyId = await repo.findEntryLobbyId(input.entryId);
  if (entryLobbyId !== actualLobbyId) return { type: 'invalidEntry' };

  const seat = await repo.addSeat(gameSessionId, input.entryId);
  if (!seat) return { type: 'alreadySeated' };

  return { type: 'ok', seat };
};
