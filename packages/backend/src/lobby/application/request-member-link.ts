import type { LobbyMemberLinkRequest } from '@taku-biyori/shared';

export interface RequestMemberLinkRepository {
  findLobbyVisibility(
    id: string,
  ): Promise<{ isPublished: boolean; hostUserId: string } | null>;
  // memberId がその募集枠のゲストメンバー（user_id = null）か
  isGuestMember(lobbyId: string, memberId: string): Promise<boolean>;
  findMemberByUserId(lobbyId: string, userId: string): Promise<string | null>;
  // null は一意制約違反（同一ユーザーによる重複申請）を表す
  insertLinkRequest(
    memberId: string,
    userId: string,
  ): Promise<LobbyMemberLinkRequest | null>;
}

export type RequestMemberLinkResult =
  | { type: 'ok'; request: LobbyMemberLinkRequest }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'notGuestMember' }
  | { type: 'alreadyMember' }
  | { type: 'alreadyRequested' };

/**
 * ゲスト行を自分のアカウントに紐づけるよう申請する（ADR 0008）。
 *
 * 申請は権限の行使ではなく情報の提出であり、実際の紐づけはホストの承認で確定する。
 * そのため `Guest-Token` は要求しない。ゲストリンクは認証の往復（OAuth のリダイレクト）で
 * 失われるうえ、募集枠ごとの共有トークンなので「本人である」ことを何も証明しないため。
 *
 * ステータスによる制限は設けない。完了済みの卓を履歴として取り込むのが主目的のため。
 */
export const requestMemberLink = async (
  repo: RequestMemberLinkRepository,
  lobbyId: string,
  memberId: string,
  userId: string,
): Promise<RequestMemberLinkResult> => {
  const visibility = await repo.findLobbyVisibility(lobbyId);
  if (!visibility) return { type: 'notFound' };

  // 非公開（draft）の募集枠にゲストは存在しえないため申請させない
  if (!visibility.isPublished) return { type: 'forbidden' };

  const [isGuest, existingMemberId] = await Promise.all([
    repo.isGuestMember(lobbyId, memberId),
    repo.findMemberByUserId(lobbyId, userId),
  ]);

  // メンバー非存在とログインユーザー行を区別せず 403 とする。
  // 存在有無を漏らさないためで、ゲスト回答（updateGuestAvailabilityDateResponse）と同方針。
  if (!isGuest) return { type: 'notGuestMember' };

  // 承認時に (lobby_id, user_id) の一意制約へ必ず衝突するため、申請の時点で弾く
  if (existingMemberId !== null) return { type: 'alreadyMember' };

  const request = await repo.insertLinkRequest(memberId, userId);
  if (request === null) return { type: 'alreadyRequested' };

  return { type: 'ok', request };
};
