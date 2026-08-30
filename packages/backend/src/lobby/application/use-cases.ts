import type {
  Lobby,
  LobbyListItem,
  CreateLobbyInput,
  UpdateLobbyInput,
  UpdateLobbyStatusInput,
  JoinLobbyInput,
  JoinLobbyAsGuestInput,
  CreateSchedulePollInput,
  ReplaceCandidateDatesInput,
  UpsertScheduleAnswersInput,
  GuestUpsertScheduleAnswersInput,
} from '@taku-biyori/shared';
import type { GetLobbyResult } from '@/lobby/application/get-lobby';
import type { UpdateLobbyResult } from '@/lobby/application/update-lobby';
import type { DeleteLobbyResult } from '@/lobby/application/delete-lobby';
import type { UpdateLobbyStatusResult } from '@/lobby/application/update-lobby-status';
import type { ListLobbiesRepository } from '@/lobby/application/list-lobbies';
import type { CreateLobbyRepository } from '@/lobby/application/create-lobby';
import type { GetLobbyRepository } from '@/lobby/application/get-lobby';
import type { UpdateLobbyRepository } from '@/lobby/application/update-lobby';
import type { DeleteLobbyRepository } from '@/lobby/application/delete-lobby';
import type { UpdateLobbyStatusRepository } from '@/lobby/application/update-lobby-status';
import type { ListEntriesResult } from '@/lobby/application/list-entries';
import type { JoinLobbyResult } from '@/lobby/application/join-lobby';
import type { JoinAsGuestResult } from '@/lobby/application/join-as-guest';
import type { LeaveLobbyResult } from '@/lobby/application/leave-lobby';
import type { GetGuestLinkResult } from '@/lobby/application/get-guest-link';
import type { RegenerateGuestLinkResult } from '@/lobby/application/regenerate-guest-link';
import type { RegenerateGuestLinkRepository } from '@/lobby/application/regenerate-guest-link';
import type { ListEntriesRepository } from '@/lobby/application/list-entries';
import type { JoinLobbyRepository } from '@/lobby/application/join-lobby';
import type { JoinAsGuestRepository } from '@/lobby/application/join-as-guest';
import type { LeaveLobbyRepository } from '@/lobby/application/leave-lobby';
import type { GetGuestLinkRepository } from '@/lobby/application/get-guest-link';
import type { ListSchedulePollsResult } from '@/lobby/application/list-schedule-polls';
import type { ListSchedulePollsRepository } from '@/lobby/application/list-schedule-polls';
import type { GetSchedulePollResult } from '@/lobby/application/get-schedule-poll';
import type { GetSchedulePollRepository } from '@/lobby/application/get-schedule-poll';
import type { CreateSchedulePollResult } from '@/lobby/application/create-schedule-poll';
import type { CreateSchedulePollRepository } from '@/lobby/application/create-schedule-poll';
import type { ReplaceCandidateDatesResult } from '@/lobby/application/replace-candidate-dates';
import type { ReplaceCandidateDatesRepository } from '@/lobby/application/replace-candidate-dates';
import type { UpsertScheduleAnswersResult } from '@/lobby/application/upsert-schedule-answers';
import type { UpsertScheduleAnswersRepository } from '@/lobby/application/upsert-schedule-answers';
import type { UpsertGuestScheduleAnswersResult } from '@/lobby/application/upsert-guest-schedule-answers';
import type { UpsertGuestScheduleAnswersRepository } from '@/lobby/application/upsert-guest-schedule-answers';
import { listLobbies } from '@/lobby/application/list-lobbies';
import { createLobby } from '@/lobby/application/create-lobby';
import { getLobby } from '@/lobby/application/get-lobby';
import { updateLobby } from '@/lobby/application/update-lobby';
import { deleteLobby } from '@/lobby/application/delete-lobby';
import { updateLobbyStatus } from '@/lobby/application/update-lobby-status';
import { listEntries } from '@/lobby/application/list-entries';
import { joinLobby } from '@/lobby/application/join-lobby';
import { joinAsGuest } from '@/lobby/application/join-as-guest';
import { leaveLobby } from '@/lobby/application/leave-lobby';
import { getGuestLink } from '@/lobby/application/get-guest-link';
import { regenerateGuestLink } from '@/lobby/application/regenerate-guest-link';
import { listSchedulePolls } from '@/lobby/application/list-schedule-polls';
import { getSchedulePoll } from '@/lobby/application/get-schedule-poll';
import { createSchedulePoll } from '@/lobby/application/create-schedule-poll';
import { replaceCandidateDates } from '@/lobby/application/replace-candidate-dates';
import { upsertScheduleAnswers } from '@/lobby/application/upsert-schedule-answers';
import { upsertGuestScheduleAnswers } from '@/lobby/application/upsert-guest-schedule-answers';

type LobbyRepo = ListLobbiesRepository &
  CreateLobbyRepository &
  GetLobbyRepository &
  UpdateLobbyRepository &
  DeleteLobbyRepository &
  UpdateLobbyStatusRepository &
  ListEntriesRepository &
  JoinLobbyRepository &
  JoinAsGuestRepository &
  LeaveLobbyRepository &
  GetGuestLinkRepository &
  RegenerateGuestLinkRepository &
  ListSchedulePollsRepository &
  GetSchedulePollRepository &
  CreateSchedulePollRepository &
  ReplaceCandidateDatesRepository &
  UpsertScheduleAnswersRepository &
  UpsertGuestScheduleAnswersRepository;

export interface LobbyUseCases {
  listLobbies(userId: string): Promise<LobbyListItem[]>;
  createLobby(userId: string, input: CreateLobbyInput): Promise<Lobby>;
  getLobby(id: string, userId: string | null): Promise<GetLobbyResult>;
  updateLobby(
    id: string,
    userId: string,
    input: UpdateLobbyInput,
  ): Promise<UpdateLobbyResult>;
  deleteLobby(id: string, userId: string): Promise<DeleteLobbyResult>;
  updateLobbyStatus(
    id: string,
    userId: string,
    input: UpdateLobbyStatusInput,
  ): Promise<UpdateLobbyStatusResult>;
  listEntries(
    lobbyId: string,
    userId: string | null,
  ): Promise<ListEntriesResult>;
  joinLobby(
    lobbyId: string,
    userId: string,
    input: JoinLobbyInput,
  ): Promise<JoinLobbyResult>;
  joinAsGuest(
    lobbyId: string,
    token: string,
    input: JoinLobbyAsGuestInput,
  ): Promise<JoinAsGuestResult>;
  leaveLobby(
    lobbyId: string,
    entryId: string,
    userId: string,
  ): Promise<LeaveLobbyResult>;
  getGuestLink(id: string, userId: string): Promise<GetGuestLinkResult>;
  regenerateGuestLink(
    id: string,
    userId: string,
  ): Promise<RegenerateGuestLinkResult>;
  listSchedulePolls(
    lobbyId: string,
    userId: string | null,
  ): Promise<ListSchedulePollsResult>;
  getSchedulePoll(
    lobbyId: string,
    pollId: string,
    userId: string | null,
  ): Promise<GetSchedulePollResult>;
  createSchedulePoll(
    lobbyId: string,
    userId: string,
    input: CreateSchedulePollInput,
  ): Promise<CreateSchedulePollResult>;
  replaceCandidateDates(
    lobbyId: string,
    pollId: string,
    userId: string,
    input: ReplaceCandidateDatesInput,
  ): Promise<ReplaceCandidateDatesResult>;
  upsertScheduleAnswers(
    lobbyId: string,
    pollId: string,
    userId: string,
    input: UpsertScheduleAnswersInput,
  ): Promise<UpsertScheduleAnswersResult>;
  upsertGuestScheduleAnswers(
    lobbyId: string,
    pollId: string,
    token: string,
    input: GuestUpsertScheduleAnswersInput,
  ): Promise<UpsertGuestScheduleAnswersResult>;
}

export const createLobbyUseCases = (repo: LobbyRepo): LobbyUseCases => ({
  listLobbies: (userId: string): Promise<LobbyListItem[]> =>
    listLobbies(repo, userId),
  createLobby: (userId: string, input: CreateLobbyInput): Promise<Lobby> =>
    createLobby(repo, userId, input),
  getLobby: (id: string, userId: string | null): Promise<GetLobbyResult> =>
    getLobby(repo, id, userId),
  updateLobby: (
    id: string,
    userId: string,
    input: UpdateLobbyInput,
  ): Promise<UpdateLobbyResult> => updateLobby(repo, id, userId, input),
  deleteLobby: (id: string, userId: string): Promise<DeleteLobbyResult> =>
    deleteLobby(repo, id, userId),
  updateLobbyStatus: (
    id: string,
    userId: string,
    input: UpdateLobbyStatusInput,
  ): Promise<UpdateLobbyStatusResult> =>
    updateLobbyStatus(repo, id, userId, input),
  listEntries: (
    lobbyId: string,
    userId: string | null,
  ): Promise<ListEntriesResult> => listEntries(repo, lobbyId, userId),
  joinLobby: (
    lobbyId: string,
    userId: string,
    input: JoinLobbyInput,
  ): Promise<JoinLobbyResult> => joinLobby(repo, lobbyId, userId, input),
  joinAsGuest: (
    lobbyId: string,
    token: string,
    input: JoinLobbyAsGuestInput,
  ): Promise<JoinAsGuestResult> => joinAsGuest(repo, lobbyId, token, input),
  leaveLobby: (
    lobbyId: string,
    entryId: string,
    userId: string,
  ): Promise<LeaveLobbyResult> => leaveLobby(repo, lobbyId, entryId, userId),
  getGuestLink: (id: string, userId: string): Promise<GetGuestLinkResult> =>
    getGuestLink(repo, id, userId),
  regenerateGuestLink: (
    id: string,
    userId: string,
  ): Promise<RegenerateGuestLinkResult> =>
    regenerateGuestLink(repo, id, userId),
  listSchedulePolls: (
    lobbyId: string,
    userId: string | null,
  ): Promise<ListSchedulePollsResult> =>
    listSchedulePolls(repo, lobbyId, userId),
  getSchedulePoll: (
    lobbyId: string,
    pollId: string,
    userId: string | null,
  ): Promise<GetSchedulePollResult> =>
    getSchedulePoll(repo, lobbyId, pollId, userId),
  createSchedulePoll: (
    lobbyId: string,
    userId: string,
    input: CreateSchedulePollInput,
  ): Promise<CreateSchedulePollResult> =>
    createSchedulePoll(repo, lobbyId, userId, input),
  replaceCandidateDates: (
    lobbyId: string,
    pollId: string,
    userId: string,
    input: ReplaceCandidateDatesInput,
  ): Promise<ReplaceCandidateDatesResult> =>
    replaceCandidateDates(repo, lobbyId, pollId, userId, input),
  upsertScheduleAnswers: (
    lobbyId: string,
    pollId: string,
    userId: string,
    input: UpsertScheduleAnswersInput,
  ): Promise<UpsertScheduleAnswersResult> =>
    upsertScheduleAnswers(repo, lobbyId, pollId, userId, input),
  upsertGuestScheduleAnswers: (
    lobbyId: string,
    pollId: string,
    token: string,
    input: GuestUpsertScheduleAnswersInput,
  ): Promise<UpsertGuestScheduleAnswersResult> =>
    upsertGuestScheduleAnswers(repo, lobbyId, pollId, token, input),
});
