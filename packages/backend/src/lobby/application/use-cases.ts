import type {
  Lobby,
  LobbyListItem,
  CreateLobbyInput,
  UpdateLobbyInput,
  UpdateLobbyStatusInput,
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
import { listLobbies } from '@/lobby/application/list-lobbies';
import { createLobby } from '@/lobby/application/create-lobby';
import { getLobby } from '@/lobby/application/get-lobby';
import { updateLobby } from '@/lobby/application/update-lobby';
import { deleteLobby } from '@/lobby/application/delete-lobby';
import { updateLobbyStatus } from '@/lobby/application/update-lobby-status';

type LobbyRepo = ListLobbiesRepository &
  CreateLobbyRepository &
  GetLobbyRepository &
  UpdateLobbyRepository &
  DeleteLobbyRepository &
  UpdateLobbyStatusRepository;

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
});
