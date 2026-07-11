import type {
  LobbyAvailabilityDateAnswer,
  UpdateLobbyAvailabilityDateResponseInput,
} from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyStatusInput } from '@/lobby/domain/lobby-status';
import { getLobbyStatus } from '@/lobby/domain/lobby-status';

export interface UpdateAvailabilityDateResponseRepository {
  findStatusFields(lobbyId: string): Promise<LobbyStatusInput | null>;
  findCandidateOwner(
    dateId: string,
  ): Promise<{ lobbyId: string; date: string } | null>;
  findMemberByUserId(lobbyId: string, userId: string): Promise<string | null>;
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

  const memberId = await repo.findMemberByUserId(lobbyId, userId);
  if (!memberId) return { type: 'forbidden' };

  const status = getLobbyStatus(fields);
  if (status === LobbyStatus.draft) return { type: 'notPublished' };
  if (status !== LobbyStatus.open && status !== LobbyStatus.scheduling) {
    return { type: 'invalidStatus' };
  }

  const answer = await repo.upsertAnswer(dateId, memberId, input);
  return { type: 'ok', answer };
};
