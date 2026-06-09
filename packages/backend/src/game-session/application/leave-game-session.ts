export interface LeaveGameSessionRepository {
  findMemberOwner(
    memberId: string,
  ): Promise<{ gameSessionId: string; userId: string | null } | null>;
  findHostUserId(id: string): Promise<string | null>;
  deleteMemberById(memberId: string): Promise<void>;
}

export type LeaveGameSessionResult =
  | { type: 'ok' }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'hostCannotLeave' };

export const leaveGameSession = async (
  repo: LeaveGameSessionRepository,
  gameSessionId: string,
  memberId: string,
  userId: string,
): Promise<LeaveGameSessionResult> => {
  const memberOwner = await repo.findMemberOwner(memberId);
  if (!memberOwner || memberOwner.gameSessionId !== gameSessionId) {
    return { type: 'notFound' };
  }

  const hostUserId = await repo.findHostUserId(gameSessionId);
  const isHost = hostUserId === userId;
  const isSelf = memberOwner.userId === userId;

  if (!isHost && !isSelf) return { type: 'forbidden' };

  // ホストは退出不可
  if (memberOwner.userId === hostUserId) return { type: 'hostCannotLeave' };

  await repo.deleteMemberById(memberId);
  return { type: 'ok' };
};
