import type {
  Lobby,
  LobbyListItem,
  CreateLobbyInput,
  UpdateLobbyInput,
  UpdateLobbyStatusInput,
  JoinLobbyInput,
  JoinLobbyAsGuestInput,
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
import type { ListMembersResult } from '@/lobby/application/list-members';
import type { JoinLobbyResult } from '@/lobby/application/join-lobby';
import type { JoinAsGuestResult } from '@/lobby/application/join-as-guest';
import type { LeaveLobbyResult } from '@/lobby/application/leave-lobby';
import type { GetGuestLinkResult } from '@/lobby/application/get-guest-link';
import type { ListMembersRepository } from '@/lobby/application/list-members';
import type { JoinLobbyRepository } from '@/lobby/application/join-lobby';
import type { JoinAsGuestRepository } from '@/lobby/application/join-as-guest';
import type { LeaveLobbyRepository } from '@/lobby/application/leave-lobby';
import type { GetGuestLinkRepository } from '@/lobby/application/get-guest-link';
import { listLobbies } from '@/lobby/application/list-lobbies';
import { createLobby } from '@/lobby/application/create-lobby';
import { getLobby } from '@/lobby/application/get-lobby';
import { updateLobby } from '@/lobby/application/update-lobby';
import { deleteLobby } from '@/lobby/application/delete-lobby';
import { updateLobbyStatus } from '@/lobby/application/update-lobby-status';
import { listMembers } from '@/lobby/application/list-members';
import { joinLobby } from '@/lobby/application/join-lobby';
import { joinAsGuest } from '@/lobby/application/join-as-guest';
import { leaveLobby } from '@/lobby/application/leave-lobby';
import { getGuestLink } from '@/lobby/application/get-guest-link';

type LobbyRepo = ListLobbiesRepository &
  CreateLobbyRepository &
  GetLobbyRepository &
  UpdateLobbyRepository &
  DeleteLobbyRepository &
  UpdateLobbyStatusRepository &
  ListMembersRepository &
  JoinLobbyRepository &
  JoinAsGuestRepository &
  LeaveLobbyRepository &
  GetGuestLinkRepository;

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
  listMembers(
    lobbyId: string,
    userId: string | null,
  ): Promise<ListMembersResult>;
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
    memberId: string,
    userId: string,
  ): Promise<LeaveLobbyResult>;
  getGuestLink(id: string, userId: string): Promise<GetGuestLinkResult>;
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
  listMembers: (
    lobbyId: string,
    userId: string | null,
  ): Promise<ListMembersResult> => listMembers(repo, lobbyId, userId),
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
    memberId: string,
    userId: string,
  ): Promise<LeaveLobbyResult> => leaveLobby(repo, lobbyId, memberId, userId),
  getGuestLink: (id: string, userId: string): Promise<GetGuestLinkResult> =>
    getGuestLink(repo, id, userId),
});
