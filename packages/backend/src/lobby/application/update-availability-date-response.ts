import type {
  LobbyAvailabilityDateAnswer,
  UpdateLobbyAvailabilityDateResponseInput,
} from '@taku-biyori/shared';
import {
  LobbyAction,
  LobbyStatus,
  canPerformLobbyAction,
  getLobbyStatus,
  type LobbyStatusFacts,
} from '@taku-biyori/shared';

export interface UpdateAvailabilityDateResponseRepository {
  findStatusFields(lobbyId: string): Promise<LobbyStatusFacts | null>;
  findCandidateOwner(
    dateId: string,
  ): Promise<{ lobbyId: string; date: string } | null>;
  /** 在籍中の参加だけを引く。脱退済みの行では回答させない */
  findActiveEntryByUserId(
    lobbyId: string,
    userId: string,
  ): Promise<string | null>;
  upsertAnswer(
    candidateId: string,
    memberId: string,
    input: UpdateLobbyAvailabilityDateResponseInput,
  ): Promise<LobbyAvailabilityDateAnswer>;
}

export type UpdateAvailabilityDateResponseResult =
  | { type: 'ok'; answer: LobbyAvailabilityDateAnswer }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  // 公開前（draft）は回答できない。game-session にはないチェック（design-v1.1 意思決定ログ）
  | { type: 'notPublished' }
  | { type: 'invalidStatus' };

export const updateAvailabilityDateResponse = async (
  repo: UpdateAvailabilityDateResponseRepository,
  lobbyId: string,
  dateId: string,
  userId: string,
  input: UpdateLobbyAvailabilityDateResponseInput,
): Promise<UpdateAvailabilityDateResponseResult> => {
  const fields = await repo.findStatusFields(lobbyId);
  if (!fields) return { type: 'notFound' };

  const candidate = await repo.findCandidateOwner(dateId);
  if (!candidate || candidate.lobbyId !== lobbyId) return { type: 'notFound' };

  const memberId = await repo.findActiveEntryByUserId(lobbyId, userId);
  if (!memberId) return { type: 'forbidden' };

  const status = getLobbyStatus(fields);
  if (status === LobbyStatus.draft) return { type: 'notPublished' };
  // 受付終了（closed）でも、すでに参加している人は回答できる（design-v2 §3-2）
  if (!canPerformLobbyAction(LobbyAction.answerSchedule, status, 'member')) {
    return { type: 'invalidStatus' };
  }

  const answer = await repo.upsertAnswer(dateId, memberId, input);
  return { type: 'ok', answer };
};
