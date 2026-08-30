/**
 * アカウントを持たない参加者かどうかを判定する。
 */
export const isGuestMember = (
  member: Pick<{ userId: string | null }, 'userId'>,
): boolean => {
  return member.userId === null;
};
