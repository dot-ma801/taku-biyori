import type {
  LobbyAvailabilityDateAnswer,
  UpdateLobbyAvailabilityDateResponseInput,
} from '@taku-biyori/shared';
import {
  LobbyAction,
  canPerformLobbyAction,
  getLobbyStatus,
  type LobbyStatusFacts,
} from '@taku-biyori/shared';

export interface UpdateGuestAvailabilityDateResponseRepository {
  // 募集枠の guest_link_token。null は募集枠非存在を表す
  findGuestLinkToken(lobbyId: string): Promise<string | null>;
  findStatusFields(lobbyId: string): Promise<LobbyStatusFacts | null>;
  findCandidateOwner(
    dateId: string,
  ): Promise<{ lobbyId: string; date: string } | null>;
  // entryId がそのロビーの在籍中ゲスト（user_id = null かつ left_at = null）か
  isGuestEntry(lobbyId: string, entryId: string): Promise<boolean>;
  upsertAnswer(
    candidateId: string,
    memberId: string,
    input: UpdateLobbyAvailabilityDateResponseInput,
  ): Promise<LobbyAvailabilityDateAnswer>;
}

export type UpdateGuestAvailabilityDateResponseResult =
  | { type: 'ok'; answer: LobbyAvailabilityDateAnswer }
  | { type: 'notFound' }
  | { type: 'invalidToken' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' };

/**
 * ゲスト（完全匿名）が日程候補に回答する（調整さん方式）。
 * - トークンが募集枠の guest_link_token と一致しなければ invalidToken（403 相当）
 * - 回答を許すステータス（open / closed）以外なら invalidStatus（409 相当）。
 *   未公開（draft）と解散（disbanded）が該当する。draft も含めて一律 409 とするのは
 *   design-v1.1 の意思決定ログを継続したもの。受付終了（closed）でも回答は続けられる
 *   （閉じているのは新しい参加の入口だけ。design-v2 §3-2）
 * - 指定 entryId がそのロビーの在籍中ゲスト（user_id = null）でなければ forbidden（403 相当）
 * 本人確認はしないため、トークンさえ持っていればどのゲスト列でも更新できる。
 */
export const updateGuestAvailabilityDateResponse = async (
  repo: UpdateGuestAvailabilityDateResponseRepository,
  lobbyId: string,
  dateId: string,
  token: string,
  memberId: string,
  input: UpdateLobbyAvailabilityDateResponseInput,
): Promise<UpdateGuestAvailabilityDateResponseResult> => {
  // token 検証と status 取得を並列で実行してレイテンシを削減する
  const [storedToken, fields] = await Promise.all([
    repo.findGuestLinkToken(lobbyId),
    repo.findStatusFields(lobbyId),
  ]);

  if (!fields) return { type: 'notFound' };
  if (storedToken !== token) return { type: 'invalidToken' };

  const status = getLobbyStatus(fields);
  if (!canPerformLobbyAction(LobbyAction.answerSchedule, status, 'guest')) {
    return { type: 'invalidStatus' };
  }

  const candidate = await repo.findCandidateOwner(dateId);
  if (!candidate || candidate.lobbyId !== lobbyId) {
    return { type: 'notFound' };
  }

  const isGuest = await repo.isGuestEntry(lobbyId, memberId);
  if (!isGuest) return { type: 'forbidden' };

  const answer = await repo.upsertAnswer(dateId, memberId, input);
  return { type: 'ok', answer };
};
