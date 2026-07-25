import type { GameSessionStatus } from '@taku-biyori/shared';
import { GameSessionAction, canPerform } from '@taku-biyori/shared';

export interface LeaveGameSessionRepository {
  findMemberOwner(
    memberId: string,
  ): Promise<{ gameSessionId: string; userId: string | null } | null>;
  findHostUserId(id: string): Promise<string | null>;
  findGameSessionStatus(id: string): Promise<GameSessionStatus | null>;
  deleteMemberById(memberId: string): Promise<void>;
}

export type LeaveGameSessionResult =
  | { type: 'ok' }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'hostCannotLeave' }
  | { type: 'sessionNotOpen' };

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

  const status = await repo.findGameSessionStatus(gameSessionId);
  // 退出可能なステータスは ACTION_POLICIES の leaveSession に委譲する
  // （段階6b で open を導出しなくなったため confirmed / today / scheduling が該当）
  if (
    status === null ||
    !canPerform(GameSessionAction.leaveSession, status, 'member')
  ) {
    return { type: 'sessionNotOpen' };
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
