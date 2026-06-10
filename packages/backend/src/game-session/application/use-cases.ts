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
import type { GetGameSessionResult } from '@/game-session/application/get-game-session';
import type { UpdateGameSessionResult } from '@/game-session/application/update-game-session';
import type { DeleteGameSessionResult } from '@/game-session/application/delete-game-session';
import type { UpdateGameSessionStatusResult } from '@/game-session/application/update-game-session-status';
import type { ListAvailabilityDatesResult } from '@/game-session/application/list-availability-dates';
import type { AddAvailabilityDateResult } from '@/game-session/application/add-availability-date';
import type { DeleteAvailabilityDateResult } from '@/game-session/application/delete-availability-date';
import type { ConfirmAvailabilityDateResult } from '@/game-session/application/confirm-availability-date';
import type { BulkUpdateAvailabilityDatesResult } from '@/game-session/application/bulk-update-availability-dates';
import type { UpdateAvailabilityDateResponseResult } from '@/game-session/application/update-availability-date-response';
import type { ListMembersResult } from '@/game-session/application/list-members';
import type { JoinGameSessionResult } from '@/game-session/application/join-game-session';
import type { JoinAsGuestResult } from '@/game-session/application/join-as-guest';
import type { UpdateMemberResult } from '@/game-session/application/update-member';
import type { LeaveGameSessionResult } from '@/game-session/application/leave-game-session';
import type { GetGuestLinkResult } from '@/game-session/application/get-guest-link';
import type { GetGuestLinkPreviewResult } from '@/game-session/application/get-guest-link-preview';
import type { ListGameSessionsRepository } from '@/game-session/application/list-game-sessions';
import type { CreateGameSessionRepository } from '@/game-session/application/create-game-session';
import type { GetGameSessionRepository } from '@/game-session/application/get-game-session';
import type { UpdateGameSessionRepository } from '@/game-session/application/update-game-session';
import type { DeleteGameSessionRepository } from '@/game-session/application/delete-game-session';
import type { UpdateGameSessionStatusRepository } from '@/game-session/application/update-game-session-status';
import type { ListAvailabilityDatesRepository } from '@/game-session/application/list-availability-dates';
import type { AddAvailabilityDateRepository } from '@/game-session/application/add-availability-date';
import type { DeleteAvailabilityDateRepository } from '@/game-session/application/delete-availability-date';
import type { ConfirmAvailabilityDateRepository } from '@/game-session/application/confirm-availability-date';
import type { BulkUpdateAvailabilityDatesRepository } from '@/game-session/application/bulk-update-availability-dates';
import type { UpdateAvailabilityDateResponseRepository } from '@/game-session/application/update-availability-date-response';
import type { ListMembersRepository } from '@/game-session/application/list-members';
import type { JoinGameSessionRepository } from '@/game-session/application/join-game-session';
import type { JoinAsGuestRepository } from '@/game-session/application/join-as-guest';
import type { UpdateMemberRepository } from '@/game-session/application/update-member';
import type { LeaveGameSessionRepository } from '@/game-session/application/leave-game-session';
import type { GetGuestLinkRepository } from '@/game-session/application/get-guest-link';
import type { GetGuestLinkPreviewRepository } from '@/game-session/application/get-guest-link-preview';
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

export interface GameSessionUseCases {
  listGameSessions(userId: string): Promise<GameSessionListItem[]>;
  createGameSession(
    userId: string,
    input: CreateGameSessionInput,
  ): Promise<GameSession>;
  getGameSession(
    id: string,
    userId: string | null,
  ): Promise<GetGameSessionResult>;
  updateGameSession(
    id: string,
    userId: string,
    input: UpdateGameSessionInput,
  ): Promise<UpdateGameSessionResult>;
  deleteGameSession(
    id: string,
    userId: string,
  ): Promise<DeleteGameSessionResult>;
  updateGameSessionStatus(
    id: string,
    userId: string,
    input: UpdateGameSessionStatusInput,
  ): Promise<UpdateGameSessionStatusResult>;
  listAvailabilityDates(
    gameSessionId: string,
  ): Promise<ListAvailabilityDatesResult>;
  addAvailabilityDate(
    gameSessionId: string,
    userId: string,
    input: CreateAvailabilityDateInput,
  ): Promise<AddAvailabilityDateResult>;
  deleteAvailabilityDate(
    gameSessionId: string,
    dateId: string,
    userId: string,
  ): Promise<DeleteAvailabilityDateResult>;
  confirmAvailabilityDate(
    gameSessionId: string,
    dateId: string,
    userId: string,
  ): Promise<ConfirmAvailabilityDateResult>;
  bulkUpdateAvailabilityDates(
    gameSessionId: string,
    userId: string,
    input: BulkUpdateAvailabilityDatesInput,
  ): Promise<BulkUpdateAvailabilityDatesResult>;
  updateAvailabilityDateResponse(
    gameSessionId: string,
    dateId: string,
    userId: string,
    input: UpdateAvailabilityDateResponseInput,
  ): Promise<UpdateAvailabilityDateResponseResult>;
  listMembers(gameSessionId: string): Promise<ListMembersResult>;
  joinGameSession(
    gameSessionId: string,
    userId: string,
    input: JoinGameSessionInput,
  ): Promise<JoinGameSessionResult>;
  joinAsGuest(
    gameSessionId: string,
    input: JoinAsGuestInput,
  ): Promise<JoinAsGuestResult>;
  updateMember(
    gameSessionId: string,
    memberId: string,
    userId: string,
    input: UpdateMemberInput,
  ): Promise<UpdateMemberResult>;
  leaveGameSession(
    gameSessionId: string,
    memberId: string,
    userId: string,
  ): Promise<LeaveGameSessionResult>;
  getGuestLink(id: string, userId: string): Promise<GetGuestLinkResult>;
  getGuestLinkPreview(token: string): Promise<GetGuestLinkPreviewResult>;
}

export const createGameSessionUseCases = (
  repo: GameSessionRepo,
): GameSessionUseCases => ({
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
