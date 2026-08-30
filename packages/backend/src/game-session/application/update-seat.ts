import type {
  GameSessionStatusFacts,
  Seat,
  UpdateSeatInput,
} from '@taku-biyori/shared';
import {
  GameSessionAction,
  canPerform,
  getGameSessionStatus,
} from '@taku-biyori/shared';

export interface UpdateSeatRepository {
  findLobbyId(id: string): Promise<string | null>;
  findHostUserId(id: string): Promise<string | null>;
  findStatusFields(id: string): Promise<GameSessionStatusFacts | null>;
  findSeatOwner(
    seatId: string,
  ): Promise<{ gameSessionId: string; userId: string | null } | null>;
  updateSeatCharacterName(
    seatId: string,
    characterName: string | null,
  ): Promise<Seat | null>;
}

export type UpdateSeatResult =
  | { type: 'ok'; seat: Seat }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' };

/**
 * 着席のキャラクター名を割り当て・解除する（design-v2 §6-6）。
 *
 * 更新できるのはキャラクター名だけ。それ以外は着席というファクトそのものなので変えられない。
 * 完了した開催でも更新できる（あとからキャラ名を埋める運用があるため）。中止は不可。
 *
 * 「本人またはホスト」の本人性はロールとステータスの2軸で表せないため、
 * ポリシー表ではなくここで判定する（design-v2 §4-5）。
 */
export const updateSeat = async (
  repo: UpdateSeatRepository,
  lobbyId: string,
  gameSessionId: string,
  seatId: string,
  userId: string,
  input: UpdateSeatInput,
): Promise<UpdateSeatResult> => {
  const actualLobbyId = await repo.findLobbyId(gameSessionId);
  if (actualLobbyId === null) return { type: 'notFound' };
  if (actualLobbyId !== lobbyId) return { type: 'notFound' };

  const owner = await repo.findSeatOwner(seatId);
  if (!owner || owner.gameSessionId !== gameSessionId) {
    return { type: 'notFound' };
  }

  const hostUserId = await repo.findHostUserId(gameSessionId);
  const isHost = hostUserId === userId;
  const isSelf = owner.userId === userId;
  if (!isHost && !isSelf) return { type: 'forbidden' };

  const facts = await repo.findStatusFields(gameSessionId);
  if (!facts) return { type: 'notFound' };

  const status = getGameSessionStatus(facts);
  if (
    !canPerform(
      GameSessionAction.assignCharacter,
      status,
      isHost ? 'host' : 'member',
    )
  ) {
    return { type: 'invalidStatus' };
  }

  const seat = await repo.updateSeatCharacterName(seatId, input.characterName);
  if (!seat) return { type: 'notFound' };

  return { type: 'ok', seat };
};
