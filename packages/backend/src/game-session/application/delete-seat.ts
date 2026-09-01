import type { GameSessionStatusFacts } from '@taku-biyori/shared';
import {
  GameSessionAction,
  canPerform,
  getGameSessionStatus,
} from '@taku-biyori/shared';

export interface DeleteSeatRepository {
  findLobbyId(id: string): Promise<string | null>;
  findHostUserId(id: string): Promise<string | null>;
  findStatusFields(id: string): Promise<GameSessionStatusFacts | null>;
  findSeatOwner(
    seatId: string,
  ): Promise<{ gameSessionId: string; userId: string | null } | null>;
  deleteSeatById(seatId: string): Promise<void>;
}

export type DeleteSeatResult =
  | { type: 'ok' }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' };

/**
 * 離席する（design-v2 §6-6）。**本人またはホスト**が操作できる。
 *
 * Seat の行はハード削除する。着席は「選ばれた」というファクトそのものなので、
 * 取り消しは行を消すことで表す（LobbyEntry のソフト脱退とは扱いが違う。§9-5）。
 * 席を消すと、その席のキャラクター割り当てとプレイメモも cascade で消える。
 */
export const deleteSeat = async (
  repo: DeleteSeatRepository,
  lobbyId: string,
  gameSessionId: string,
  seatId: string,
  userId: string,
): Promise<DeleteSeatResult> => {
  const actualLobbyId = await repo.findLobbyId(gameSessionId);
  if (actualLobbyId === null) return { type: 'notFound' };
  if (actualLobbyId !== lobbyId) return { type: 'notFound' };

  const owner = await repo.findSeatOwner(seatId);
  if (!owner || owner.gameSessionId !== gameSessionId) {
    return { type: 'notFound' };
  }

  const hostUserId = await repo.findHostUserId(gameSessionId);
  const isHost = hostUserId === userId;
  // ゲストの席は userId が null なので、本人性はログインユーザーにしか成立しない。
  // ホストが外す経路が別にあるため詰まらない
  const isSelf = owner.userId !== null && owner.userId === userId;
  if (!isHost && !isSelf) return { type: 'forbidden' };

  const facts = await repo.findStatusFields(gameSessionId);
  if (!facts) return { type: 'notFound' };

  const status = getGameSessionStatus(facts);
  if (
    !canPerform(GameSessionAction.unseat, status, isHost ? 'host' : 'member')
  ) {
    return { type: 'invalidStatus' };
  }

  await repo.deleteSeatById(seatId);
  return { type: 'ok' };
};
