import type { LobbyMember, JoinLobbyAsGuestInput } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';

export interface JoinAsGuestRepository {
  // null は募集枠が存在しないことを表す
  findLobbyStatus(id: string): Promise<LobbyStatus | null>;
  // 募集枠の guest_link_token。null は募集枠非存在（またはトークン未設定）
  findGuestLinkToken(id: string): Promise<string | null>;
  addGuestMember(
    lobbyId: string,
    input: JoinLobbyAsGuestInput,
  ): Promise<LobbyMember>;
}

export type JoinAsGuestResult =
  | { type: 'ok'; member: LobbyMember }
  | { type: 'notFound' }
  | { type: 'invalidToken' }
  | { type: 'lobbyNotOpen' };

/**
 * ゲスト（完全匿名）として募集枠に参加する。
 * - トークンが募集枠の guest_link_token と一致しなければ invalidToken（403 相当）
 * - status が open でなければ lobbyNotOpen（422 相当・通常参加と同条件）
 * 本人確認手段がないため重複参加は許容する（dup チェックを行わない）。
 * status 取得とトークン取得を並列化してレイテンシを削減する。
 */
export const joinAsGuest = async (
  repo: JoinAsGuestRepository,
  lobbyId: string,
  token: string,
  input: JoinLobbyAsGuestInput,
): Promise<JoinAsGuestResult> => {
  const [status, storedToken] = await Promise.all([
    repo.findLobbyStatus(lobbyId),
    repo.findGuestLinkToken(lobbyId),
  ]);

  if (status === null) return { type: 'notFound' };

  if (storedToken === null || storedToken !== token) {
    return { type: 'invalidToken' };
  }

  if (status !== LobbyStatus.open) return { type: 'lobbyNotOpen' };

  const member = await repo.addGuestMember(lobbyId, input);
  return { type: 'ok', member };
};
