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

export interface CharacterAssignmentRepository {
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
export type UpdateCharacterAssignmentResult =
  | { type: 'ok'; seat: Seat }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' };

/**
 * 着席のキャラクター名を割り当て・解除する（design-v2 §6-11）。
 * **ホストまたはその席の本人**が操作できる。
 *
 * `characterName` が文字列なら `character_assignments` へ upsert、`null` なら削除。
 * 実体は別テーブルだが API から見た更新対象は Seat のままなので、戻り値も Seat。
 */
export const updateCharacterAssignment = async (
  repo: CharacterAssignmentRepository,
  lobbyId: string,
  gameSessionId: string,
  seatId: string,
  userId: string,
  input: UpdateSeatInput,
): Promise<UpdateCharacterAssignmentResult> => {
  // URL のロビーがこの開催のロビーでなければ 404。入れ子のパスを名乗るのに
  // 親を見ないと、無関係なロビー ID でも通ってしまう（他の入れ子操作と揃える）
  const actualLobbyId = await repo.findLobbyId(gameSessionId);
  if (actualLobbyId === null || actualLobbyId !== lobbyId) {
    return { type: 'notFound' };
  }

  const owner = await repo.findSeatOwner(seatId);
  if (!owner || owner.gameSessionId !== gameSessionId)
    return { type: 'notFound' };
  const host = await repo.findHostUserId(gameSessionId);
  const isHost = host === userId;
  if (!isHost && owner.userId !== userId) return { type: 'forbidden' };
  const facts = await repo.findStatusFields(gameSessionId);
  if (!facts) return { type: 'notFound' };
  const status = getGameSessionStatus(facts);
  if (
    !canPerform(
      GameSessionAction.assignCharacter,
      status,
      isHost ? 'host' : 'member',
    )
  )
    return { type: 'invalidStatus' };
  const seat = await repo.updateSeatCharacterName(seatId, input.characterName);
  return seat ? { type: 'ok', seat } : { type: 'notFound' };
};
