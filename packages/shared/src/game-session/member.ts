import type { GameSessionMember } from '@/game-session';

/**
 * ゲストメンバー（アカウントを持たず招待リンクから参加したメンバー）かどうかを判定する。
 */
export const isGuestMember = (
  member: Pick<GameSessionMember, 'userId'>,
): boolean => {
  return member.userId === null;
};
