import type {
  AvailabilityDateAnswer,
  UpdateAvailabilityDateResponseInput,
} from '@taku-biyori/shared';

export interface UpdateGuestAvailabilityDateResponseRepository {
  // セッションの guest_link_token。null はセッション非存在を表す
  findGuestLinkToken(id: string): Promise<string | null>;
  findCandidateOwner(
    dateId: string,
  ): Promise<{ gameSessionId: string; date: string } | null>;
  // memberId がその卓のゲストメンバー（user_id = null）か
  isGuestMember(gameSessionId: string, memberId: string): Promise<boolean>;
  upsertAnswer(
    candidateId: string,
    memberId: string,
    input: UpdateAvailabilityDateResponseInput,
  ): Promise<AvailabilityDateAnswer>;
}

export type UpdateGuestAvailabilityDateResponseResult =
  | { type: 'ok'; answer: AvailabilityDateAnswer }
  | { type: 'notFound' }
  | { type: 'invalidToken' }
  | { type: 'forbidden' };

/**
 * ゲスト（完全匿名）が日程候補に回答する。
 * - トークンがセッションの guest_link_token と一致しなければ invalidToken（403 相当）
 * - 指定 memberId がその卓のゲストメンバー（user_id = null）でなければ forbidden（403 相当）
 * 本人確認はしないため、トークンさえ持っていればどのゲスト列でも更新できる。
 */
export const updateGuestAvailabilityDateResponse = async (
  repo: UpdateGuestAvailabilityDateResponseRepository,
  gameSessionId: string,
  dateId: string,
  token: string,
  memberId: string,
  input: UpdateAvailabilityDateResponseInput,
): Promise<UpdateGuestAvailabilityDateResponseResult> => {
  const storedToken = await repo.findGuestLinkToken(gameSessionId);
  if (storedToken === null) return { type: 'notFound' };
  if (storedToken !== token) return { type: 'invalidToken' };

  const candidate = await repo.findCandidateOwner(dateId);
  if (!candidate || candidate.gameSessionId !== gameSessionId) {
    return { type: 'notFound' };
  }

  const isGuest = await repo.isGuestMember(gameSessionId, memberId);
  if (!isGuest) return { type: 'forbidden' };

  const answer = await repo.upsertAnswer(dateId, memberId, input);
  return { type: 'ok', answer };
};
