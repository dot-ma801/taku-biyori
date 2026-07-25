import type {
  GameSessionMember,
  GameSessionStatus,
  JoinAsGuestInput,
} from '@taku-biyori/shared';
import { GameSessionAction, canPerform } from '@taku-biyori/shared';

export interface JoinAsGuestRepository {
  // null はセッションが存在しないことを表す
  findGameSessionStatus(id: string): Promise<GameSessionStatus | null>;
  // セッションの guest_link_token。null はセッション非存在（またはトークン未設定）
  findGuestLinkToken(id: string): Promise<string | null>;
  addGuestMember(
    gameSessionId: string,
    input: JoinAsGuestInput,
  ): Promise<GameSessionMember>;
}

export type JoinAsGuestResult =
  | { type: 'ok'; member: GameSessionMember }
  | { type: 'notFound' }
  | { type: 'invalidToken' }
  | { type: 'sessionNotOpen' };

/**
 * ゲスト（完全匿名）としてセッションに参加する。
 * - トークンがセッションの guest_link_token と一致しなければ invalidToken（403 相当）
 * - 参加条件（公開済み・未完了・実施日当日まで）を満たさなければ sessionNotOpen
 *   （422 相当・通常参加と同条件）
 * 本人確認手段がないため重複参加は許容する（dup チェックを行わない）。
 * status 取得とトークン取得を並列化してレイテンシを削減する。
 */
export const joinAsGuest = async (
  repo: JoinAsGuestRepository,
  gameSessionId: string,
  token: string,
  input: JoinAsGuestInput,
): Promise<JoinAsGuestResult> => {
  const [status, storedToken] = await Promise.all([
    repo.findGameSessionStatus(gameSessionId),
    repo.findGuestLinkToken(gameSessionId),
  ]);

  if (status === null) return { type: 'notFound' };

  if (storedToken === null || storedToken !== token) {
    return { type: 'invalidToken' };
  }

  if (!canPerform(GameSessionAction.joinSession, status, 'member')) {
    return { type: 'sessionNotOpen' };
  }

  const member = await repo.addGuestMember(gameSessionId, input);
  return { type: 'ok', member };
};
