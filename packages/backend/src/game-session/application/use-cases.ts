import type {
  GameSession,
  GameSessionListItem,
  CreateGameSessionInput,
  UpdateGameSessionInput,
  UpdateGameSessionStatusInput,
  CreateAvailabilityDateInput,
  BulkUpdateAvailabilityDatesInput,
  UpdateAvailabilityDateResponseInput,
  JoinGameSessionInput,
  JoinAsGuestInput,
  UpdateMemberInput,
} from '@taku-biyori/shared';
import type { ListGameSessionsRepository } from '@/game-session/application/list-game-sessions';
import type { CreateGameSessionRepository } from '@/game-session/application/create-game-session';
import type {
  GetGameSessionRepository,
  GetGameSessionResult,
} from '@/game-session/application/get-game-session';
import type {
  UpdateGameSessionRepository,
  UpdateGameSessionResult,
} from '@/game-session/application/update-game-session';
import type {
  DeleteGameSessionRepository,
  DeleteGameSessionResult,
} from '@/game-session/application/delete-game-session';
import type {
  UpdateGameSessionStatusRepository,
  UpdateGameSessionStatusResult,
} from '@/game-session/application/update-game-session-status';
import type {
  ListAvailabilityDatesRepository,
  ListAvailabilityDatesResult,
} from '@/game-session/application/list-availability-dates';
import type {
  AddAvailabilityDateRepository,
  AddAvailabilityDateResult,
} from '@/game-session/application/add-availability-date';
import type {
  DeleteAvailabilityDateRepository,
  DeleteAvailabilityDateResult,
} from '@/game-session/application/delete-availability-date';
import type {
  ConfirmAvailabilityDateRepository,
  ConfirmAvailabilityDateResult,
} from '@/game-session/application/confirm-availability-date';
import type {
  BulkUpdateAvailabilityDatesRepository,
  BulkUpdateAvailabilityDatesResult,
} from '@/game-session/application/bulk-update-availability-dates';
import type {
  UpdateAvailabilityDateResponseRepository,
  UpdateAvailabilityDateResponseResult,
} from '@/game-session/application/update-availability-date-response';
import type {
  ListMembersRepository,
  ListMembersResult,
} from '@/game-session/application/list-members';
import type {
  JoinGameSessionRepository,
  JoinGameSessionResult,
} from '@/game-session/application/join-game-session';
import type {
  JoinAsGuestRepository,
  JoinAsGuestResult,
} from '@/game-session/application/join-as-guest';
import type {
  UpdateMemberRepository,
  UpdateMemberResult,
} from '@/game-session/application/update-member';
import type {
  LeaveGameSessionRepository,
  LeaveGameSessionResult,
} from '@/game-session/application/leave-game-session';
import type {
  GetGuestLinkRepository,
  GetGuestLinkResult,
} from '@/game-session/application/get-guest-link';
import type {
  GetGuestLinkPreviewRepository,
  GetGuestLinkPreviewResult,
} from '@/game-session/application/get-guest-link-preview';
import { listGameSessions } from '@/game-session/application/list-game-sessions';
import { createGameSession } from '@/game-session/application/create-game-session';
import { getGameSession } from '@/game-session/application/get-game-session';
import { updateGameSession } from '@/game-session/application/update-game-session';
import { deleteGameSession } from '@/game-session/application/delete-game-session';
import { updateGameSessionStatus } from '@/game-session/application/update-game-session-status';
import { listAvailabilityDates } from '@/game-session/application/list-availability-dates';
import { addAvailabilityDate } from '@/game-session/application/add-availability-date';
import { deleteAvailabilityDate } from '@/game-session/application/delete-availability-date';
import { confirmAvailabilityDate } from '@/game-session/application/confirm-availability-date';
import { bulkUpdateAvailabilityDates } from '@/game-session/application/bulk-update-availability-dates';
import { updateAvailabilityDateResponse } from '@/game-session/application/update-availability-date-response';
import { listMembers } from '@/game-session/application/list-members';
import { joinGameSession } from '@/game-session/application/join-game-session';
import { joinAsGuest } from '@/game-session/application/join-as-guest';
import { updateMember } from '@/game-session/application/update-member';
import { leaveGameSession } from '@/game-session/application/leave-game-session';
import { getGuestLink } from '@/game-session/application/get-guest-link';
import { getGuestLinkPreview } from '@/game-session/application/get-guest-link-preview';

type GameSessionRepo = ListGameSessionsRepository &
  CreateGameSessionRepository &
  GetGameSessionRepository &
  UpdateGameSessionRepository &
  DeleteGameSessionRepository &
  UpdateGameSessionStatusRepository &
  ListAvailabilityDatesRepository &
  AddAvailabilityDateRepository &
  DeleteAvailabilityDateRepository &
  ConfirmAvailabilityDateRepository &
  BulkUpdateAvailabilityDatesRepository &
  UpdateAvailabilityDateResponseRepository &
  ListMembersRepository &
  JoinGameSessionRepository &
  JoinAsGuestRepository &
  UpdateMemberRepository &
  LeaveGameSessionRepository &
  GetGuestLinkRepository &
  GetGuestLinkPreviewRepository;

export const createGameSessionUseCases = (repo: GameSessionRepo) => ({
  listGameSessions: (userId: string): Promise<GameSessionListItem[]> =>
    listGameSessions(repo, userId),
  createGameSession: (
    userId: string,
    input: CreateGameSessionInput,
  ): Promise<GameSession> => createGameSession(repo, userId, input),
  getGameSession: (
    id: string,
    userId: string | null,
  ): Promise<GetGameSessionResult> => getGameSession(repo, id, userId),
  updateGameSession: (
    id: string,
    userId: string,
    input: UpdateGameSessionInput,
  ): Promise<UpdateGameSessionResult> =>
    updateGameSession(repo, id, userId, input),
  deleteGameSession: (
    id: string,
    userId: string,
  ): Promise<DeleteGameSessionResult> => deleteGameSession(repo, id, userId),
  updateGameSessionStatus: (
    id: string,
    userId: string,
    input: UpdateGameSessionStatusInput,
  ): Promise<UpdateGameSessionStatusResult> =>
    updateGameSessionStatus(repo, id, userId, input),
  listAvailabilityDates: (
    gameSessionId: string,
  ): Promise<ListAvailabilityDatesResult> =>
    listAvailabilityDates(repo, gameSessionId),
  addAvailabilityDate: (
    gameSessionId: string,
    userId: string,
    input: CreateAvailabilityDateInput,
  ): Promise<AddAvailabilityDateResult> =>
    addAvailabilityDate(repo, gameSessionId, userId, input),
  deleteAvailabilityDate: (
    gameSessionId: string,
    dateId: string,
    userId: string,
  ): Promise<DeleteAvailabilityDateResult> =>
    deleteAvailabilityDate(repo, gameSessionId, dateId, userId),
  confirmAvailabilityDate: (
    gameSessionId: string,
    dateId: string,
    userId: string,
  ): Promise<ConfirmAvailabilityDateResult> =>
    confirmAvailabilityDate(repo, gameSessionId, dateId, userId),
  bulkUpdateAvailabilityDates: (
    gameSessionId: string,
    userId: string,
    input: BulkUpdateAvailabilityDatesInput,
  ): Promise<BulkUpdateAvailabilityDatesResult> =>
    bulkUpdateAvailabilityDates(repo, gameSessionId, userId, input),
  updateAvailabilityDateResponse: (
    gameSessionId: string,
    dateId: string,
    userId: string,
    input: UpdateAvailabilityDateResponseInput,
  ): Promise<UpdateAvailabilityDateResponseResult> =>
    updateAvailabilityDateResponse(repo, gameSessionId, dateId, userId, input),
  listMembers: (gameSessionId: string): Promise<ListMembersResult> =>
    listMembers(repo, gameSessionId),
  joinGameSession: (
    gameSessionId: string,
    userId: string,
    input: JoinGameSessionInput,
  ): Promise<JoinGameSessionResult> =>
    joinGameSession(repo, gameSessionId, userId, input),
  joinAsGuest: (
    gameSessionId: string,
    input: JoinAsGuestInput,
  ): Promise<JoinAsGuestResult> => joinAsGuest(repo, gameSessionId, input),
  updateMember: (
    gameSessionId: string,
    memberId: string,
    userId: string,
    input: UpdateMemberInput,
  ): Promise<UpdateMemberResult> =>
    updateMember(repo, gameSessionId, memberId, userId, input),
  leaveGameSession: (
    gameSessionId: string,
    memberId: string,
    userId: string,
  ): Promise<LeaveGameSessionResult> =>
    leaveGameSession(repo, gameSessionId, memberId, userId),
  getGuestLink: (id: string, userId: string): Promise<GetGuestLinkResult> =>
    getGuestLink(repo, id, userId),
  getGuestLinkPreview: (token: string): Promise<GetGuestLinkPreviewResult> =>
    getGuestLinkPreview(repo, token),
});

export type GameSessionUseCases = ReturnType<typeof createGameSessionUseCases>;
