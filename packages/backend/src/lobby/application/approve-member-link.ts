import type { LobbyMember } from '@taku-biyori/shared';

export interface LinkRequestOwner {
  lobbyId: string;
  memberId: string;
  requestedUserId: string;
}

export interface ApproveMemberLinkRepository {
  findHostUserId(id: string): Promise<string | null>;
  findLinkRequest(requestId: string): Promise<LinkRequestOwner | null>;
  /**
   * 承認を適用する。ゲスト行に user_id を入れ、確定済みの卓など対になる行も
   * 同一トランザクションで更新し、当該メンバー宛の申請をすべて削除する。
   * null は一意制約違反（同じユーザーが既にそのメンバーとして参加済み）を表す。
   */
  applyMemberLink(
    memberId: string,
    userId: string,
  ): Promise<LobbyMember | null>;
}

export type ApproveMemberLinkResult =
  | { type: 'ok'; member: LobbyMember }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'conflict' };

/**
 * 紐づけ申請を承認してゲスト行にアカウントを結び付ける（ADR 0008）。
 * 本人確認の責務はホストの判断に置く。ここでは認可（ホストか）だけを見る。
 */
export const approveMemberLink = async (
  repo: ApproveMemberLinkRepository,
  lobbyId: string,
  requestId: string,
  userId: string,
): Promise<ApproveMemberLinkResult> => {
  const request = await repo.findLinkRequest(requestId);
  // 他の募集枠の申請IDを渡して承認できないよう、所属を検証する
  if (!request || request.lobbyId !== lobbyId) return { type: 'notFound' };

  const hostUserId = await repo.findHostUserId(lobbyId);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const member = await repo.applyMemberLink(
    request.memberId,
    request.requestedUserId,
  );
  // 申請から承認までの間に同じユーザーがログイン参加した場合に起きる。
  // 行のマージは日程回答の取捨選択を伴うため行わず、409 として弾く。
  if (member === null) return { type: 'conflict' };

  return { type: 'ok', member };
};
