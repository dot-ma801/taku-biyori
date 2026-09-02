import type { GameSessionStatusFacts, Seat } from '@taku-biyori/shared';
import {
  GameSessionAction,
  canPerform,
  getGameSessionStatus,
} from '@taku-biyori/shared';

export interface CharacterAssignmentRepository {
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

export const updateCharacterAssignment = async (
  repo: CharacterAssignmentRepository,
  gameSessionId: string,
  seatId: string,
  userId: string,
  input: { characterName: string | null },
): Promise<UpdateCharacterAssignmentResult> => {
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
