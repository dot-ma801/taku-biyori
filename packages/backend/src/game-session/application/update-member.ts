import type { GameSessionMember, UpdateMemberInput } from '@taku-biyori/shared';

export interface UpdateMemberRepository {
  findMemberOwner(
    memberId: string,
  ): Promise<{ gameSessionId: string; userId: string | null } | null>;
  findHostUserId(id: string): Promise<string | null>;
  updateMemberById(
    memberId: string,
    input: UpdateMemberInput,
  ): Promise<GameSessionMember>;
}

export type UpdateMemberResult =
  | { type: 'ok'; member: GameSessionMember }
  | { type: 'notFound' }
  | { type: 'forbidden' };

export const updateMember = async (
  repo: UpdateMemberRepository,
  gameSessionId: string,
  memberId: string,
  userId: string,
  input: UpdateMemberInput,
): Promise<UpdateMemberResult> => {
  const memberOwner = await repo.findMemberOwner(memberId);
  if (!memberOwner || memberOwner.gameSessionId !== gameSessionId) {
    return { type: 'notFound' };
  }

  const hostUserId = await repo.findHostUserId(gameSessionId);
  const isHost = hostUserId === userId;
  const isSelf = memberOwner.userId === userId;

  if (!isHost && !isSelf) return { type: 'forbidden' };

  const member = await repo.updateMemberById(memberId, input);
  return { type: 'ok', member };
};
