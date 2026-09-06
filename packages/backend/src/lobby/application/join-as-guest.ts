import type { LobbyEntry, JoinLobbyAsGuestInput } from '@taku-biyori/shared';
import {
  LobbyAction,
  LobbyStatus,
  canPerformLobbyAction,
} from '@taku-biyori/shared';

export interface JoinAsGuestRepository {
  // null はロビーが存在しないことを表す
  findLobbyStatus(id: string): Promise<LobbyStatus | null>;
  // ロビーの guest_link_token。null はロビー非存在（またはトークン未設定）
  findGuestLinkToken(id: string): Promise<string | null>;
  addGuestEntry(
    lobbyId: string,
    input: JoinLobbyAsGuestInput,
  ): Promise<LobbyEntry>;
}

export type JoinAsGuestResult =
  | { type: 'ok'; entry: LobbyEntry }
  | { type: 'notFound' }
  | { type: 'invalidToken' }
  | { type: 'lobbyNotOpen' };

/**
 * ゲスト（完全匿名）としてロビーに参加する。
 * - トークンがロビーの guest_link_token と一致しなければ invalidToken（403 相当）
 * - 参加を許すステータス（open）でなければ lobbyNotOpen（422 相当・通常参加と同条件）
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

  if (!canPerformLobbyAction(LobbyAction.joinLobby, status, 'guest')) {
    return { type: 'lobbyNotOpen' };
  }

  const entry = await repo.addGuestEntry(lobbyId, input);
  return { type: 'ok', entry };
};
