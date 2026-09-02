import type {
  CreateGameSessionInput,
  CreateSeatInput,
  GameSessionListItem,
  UpdateGameSessionInput,
  UpdateGameSessionPlayMemoVisibilityInput,
  UpdateGameSessionStatusInput,
  UpsertGameSessionPlayMemoInput,
} from '@taku-biyori/shared';
import type { GameSessionRepository } from '@/game-session/infrastructure/game-session-repository';
import type { ListLobbyGameSessionsResult } from '@/game-session/application/list-lobby-game-sessions';
import type { GetGameSessionResult } from '@/game-session/application/get-game-session';
import type { CreateGameSessionResult } from '@/game-session/application/create-game-session';
import type { UpdateGameSessionResult } from '@/game-session/application/update-game-session';
import type { DeleteGameSessionResult } from '@/game-session/application/delete-game-session';
import type { UpdateGameSessionStatusResult } from '@/game-session/application/update-game-session-status';
import type { ListSeatsResult } from '@/game-session/application/list-seats';
import type { CreateSeatResult } from '@/game-session/application/create-seat';
import type { DeleteSeatResult } from '@/game-session/application/delete-seat';
import type { GetMyPlayMemoResult } from '@/game-session/application/get-my-play-memo';
import type { UpsertMyPlayMemoResult } from '@/game-session/application/upsert-my-play-memo';
import type { UpdateMyPlayMemoVisibilityResult } from '@/game-session/application/update-my-play-memo-visibility';
import type { ListSharedPlayMemosResult } from '@/game-session/application/list-shared-play-memos';
import { listGameSessions } from '@/game-session/application/list-game-sessions';
import { listLobbyGameSessions } from '@/game-session/application/list-lobby-game-sessions';
import { getGameSession } from '@/game-session/application/get-game-session';
import { createGameSession } from '@/game-session/application/create-game-session';
import { updateGameSession } from '@/game-session/application/update-game-session';
import { deleteGameSession } from '@/game-session/application/delete-game-session';
import { updateGameSessionStatus } from '@/game-session/application/update-game-session-status';
import { listSeats } from '@/game-session/application/list-seats';
import { createSeat } from '@/game-session/application/create-seat';
import { updateCharacterAssignment } from '@/game-session/application/update-character-assignment';
import { deleteSeat } from '@/game-session/application/delete-seat';
import { getMyPlayMemo } from '@/game-session/application/get-my-play-memo';
import { upsertMyPlayMemo } from '@/game-session/application/upsert-my-play-memo';
import { updateMyPlayMemoVisibility } from '@/game-session/application/update-my-play-memo-visibility';
import { listSharedPlayMemos } from '@/game-session/application/list-shared-play-memos';

export interface GameSessionUseCases {
  listGameSessions(userId: string): Promise<GameSessionListItem[]>;
  listLobbyGameSessions(
    lobbyId: string,
    userId: string | null,
  ): Promise<ListLobbyGameSessionsResult>;
  getGameSession(
    lobbyId: string,
    id: string,
    userId: string | null,
  ): Promise<GetGameSessionResult>;
  createGameSession(
    lobbyId: string,
    userId: string,
    input: CreateGameSessionInput,
  ): Promise<CreateGameSessionResult>;
  updateGameSession(
    lobbyId: string,
    id: string,
    userId: string,
    input: UpdateGameSessionInput,
  ): Promise<UpdateGameSessionResult>;
  deleteGameSession(
    lobbyId: string,
    id: string,
    userId: string,
  ): Promise<DeleteGameSessionResult>;
  updateGameSessionStatus(
    lobbyId: string,
    id: string,
    userId: string,
    input: UpdateGameSessionStatusInput,
  ): Promise<UpdateGameSessionStatusResult>;
  listSeats(
    lobbyId: string,
    gameSessionId: string,
    userId: string | null,
  ): Promise<ListSeatsResult>;
  createSeat(
    lobbyId: string,
    gameSessionId: string,
    userId: string,
    input: CreateSeatInput,
  ): Promise<CreateSeatResult>;
  updateCharacterAssignment(
    gameSessionId: string,
    seatId: string,
    userId: string,
    characterName: string | null,
  ): Promise<
    import('@/game-session/application/update-character-assignment').UpdateCharacterAssignmentResult
  >;
  deleteSeat(
    lobbyId: string,
    gameSessionId: string,
    seatId: string,
    userId: string,
  ): Promise<DeleteSeatResult>;
  getMyPlayMemo(
    gameSessionId: string,
    userId: string,
  ): Promise<GetMyPlayMemoResult>;
  upsertMyPlayMemo(
    gameSessionId: string,
    userId: string,
    input: UpsertGameSessionPlayMemoInput,
  ): Promise<UpsertMyPlayMemoResult>;
  updateMyPlayMemoVisibility(
    gameSessionId: string,
    userId: string,
    input: UpdateGameSessionPlayMemoVisibilityInput,
  ): Promise<UpdateMyPlayMemoVisibilityResult>;
  listSharedPlayMemos(
    gameSessionId: string,
    userId: string | null,
  ): Promise<ListSharedPlayMemosResult>;
}

export const createGameSessionUseCases = (
  repo: GameSessionRepository,
): GameSessionUseCases => ({
  listGameSessions: (userId) => listGameSessions(repo, userId),
  listLobbyGameSessions: (lobbyId, userId) =>
    listLobbyGameSessions(repo, lobbyId, userId),
  getGameSession: (lobbyId, id, userId) =>
    getGameSession(repo, lobbyId, id, userId),
  createGameSession: (lobbyId, userId, input) =>
    createGameSession(repo, lobbyId, userId, input),
  updateGameSession: (lobbyId, id, userId, input) =>
    updateGameSession(repo, lobbyId, id, userId, input),
  deleteGameSession: (lobbyId, id, userId) =>
    deleteGameSession(repo, lobbyId, id, userId),
  updateGameSessionStatus: (lobbyId, id, userId, input) =>
    updateGameSessionStatus(repo, lobbyId, id, userId, input),
  listSeats: (lobbyId, gameSessionId, userId) =>
    listSeats(repo, lobbyId, gameSessionId, userId),
  createSeat: (lobbyId, gameSessionId, userId, input) =>
    createSeat(repo, lobbyId, gameSessionId, userId, input),
  updateCharacterAssignment: (gameSessionId, seatId, userId, characterName) =>
    updateCharacterAssignment(repo, gameSessionId, seatId, userId, {
      characterName,
    }),
  deleteSeat: (lobbyId, gameSessionId, seatId, userId) =>
    deleteSeat(repo, lobbyId, gameSessionId, seatId, userId),
  getMyPlayMemo: (gameSessionId, userId) =>
    getMyPlayMemo(repo, gameSessionId, userId),
  upsertMyPlayMemo: (gameSessionId, userId, input) =>
    upsertMyPlayMemo(repo, gameSessionId, userId, input),
  updateMyPlayMemoVisibility: (gameSessionId, userId, input) =>
    updateMyPlayMemoVisibility(repo, gameSessionId, userId, input),
  listSharedPlayMemos: (gameSessionId, userId) =>
    listSharedPlayMemos(repo, gameSessionId, userId),
});
