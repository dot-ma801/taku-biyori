import type {
  LobbyAvailabilityDateAnswer,
  UpdateLobbyAvailabilityDateResponseInput,
} from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyStatusInput } from '@/lobby/domain/lobby-status';
import { getLobbyStatus } from '@/lobby/domain/lobby-status';

export interface UpdateGuestAvailabilityDateResponseRepository {
  // 募集枠の guest_link_token。null は募集枠非存在を表す
  findGuestLinkToken(lobbyId: string): Promise<string | null>;
  findStatusFields(lobbyId: string): Promise<LobbyStatusInput | null>;
  findCandidateOwner(
    dateId: string,
  ): Promise<{ lobbyId: string; date: string } | null>;
  // memberId がその募集枠のゲストメンバー（user_id = null）か
  isGuestMember(lobbyId: string, memberId: string): Promise<boolean>;
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
 * - status が open / scheduling 以外（draft を含む）なら invalidStatus（409 相当）。
 *   game-session は draft 以外の非公開状態を 423 Locked として返すが、
 *   lobby では design-v1.1 の意思決定ログに従い draft も含めて一律 409 とする。
 * - 指定 memberId がその募集枠のゲストメンバー（user_id = null）でなければ forbidden（403 相当）
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
  if (status !== LobbyStatus.open && status !== LobbyStatus.scheduling) {
    return { type: 'invalidStatus' };
  }

  const candidate = await repo.findCandidateOwner(dateId);
  if (!candidate || candidate.lobbyId !== lobbyId) {
    return { type: 'notFound' };
  }

  const isGuest = await repo.isGuestMember(lobbyId, memberId);
  if (!isGuest) return { type: 'forbidden' };

  const answer = await repo.upsertAnswer(dateId, memberId, input);
  return { type: 'ok', answer };
};
