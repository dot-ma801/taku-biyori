import type {
  GameSession,
  GameSessionListItem,
  CreateGameSessionInput,
  UpdateGameSessionInput,
  UpdateGameSessionStatusInput,
  JoinGameSessionInput,
  JoinAsGuestInput,
  UpdateMemberInput,
  UpsertGameSessionPlayMemoInput,
} from '@taku-biyori/shared';
import type { GetGameSessionResult } from '@/game-session/application/get-game-session';
import type { UpdateGameSessionResult } from '@/game-session/application/update-game-session';
import type { DeleteGameSessionResult } from '@/game-session/application/delete-game-session';
import type { UpdateGameSessionStatusResult } from '@/game-session/application/update-game-session-status';
import type { ListMembersResult } from '@/game-session/application/list-members';
import type { JoinGameSessionResult } from '@/game-session/application/join-game-session';
import type { JoinAsGuestResult } from '@/game-session/application/join-as-guest';
import type { UpdateMemberResult } from '@/game-session/application/update-member';
import type { LeaveGameSessionResult } from '@/game-session/application/leave-game-session';
import type { GetGuestLinkResult } from '@/game-session/application/get-guest-link';
import type { GetGuestLinkPreviewResult } from '@/game-session/application/get-guest-link-preview';
import type { GetMyPlayMemoResult } from '@/game-session/application/get-my-play-memo';
import type { UpsertMyPlayMemoResult } from '@/game-session/application/upsert-my-play-memo';
import type { ListGameSessionsRepository } from '@/game-session/application/list-game-sessions';
import type { CreateGameSessionRepository } from '@/game-session/application/create-game-session';
import type { GetGameSessionRepository } from '@/game-session/application/get-game-session';
import type { UpdateGameSessionRepository } from '@/game-session/application/update-game-session';
import type { DeleteGameSessionRepository } from '@/game-session/application/delete-game-session';
import type { UpdateGameSessionStatusRepository } from '@/game-session/application/update-game-session-status';
import type { ListMembersRepository } from '@/game-session/application/list-members';
import type { JoinGameSessionRepository } from '@/game-session/application/join-game-session';
import type { JoinAsGuestRepository } from '@/game-session/application/join-as-guest';
import type { UpdateMemberRepository } from '@/game-session/application/update-member';
import type { LeaveGameSessionRepository } from '@/game-session/application/leave-game-session';
import type { GetGuestLinkRepository } from '@/game-session/application/get-guest-link';
import type { GetGuestLinkPreviewRepository } from '@/game-session/application/get-guest-link-preview';
import type { GetMyPlayMemoRepository } from '@/game-session/application/get-my-play-memo';
import type { UpsertMyPlayMemoRepository } from '@/game-session/application/upsert-my-play-memo';
import { listGameSessions } from '@/game-session/application/list-game-sessions';
import { createGameSession } from '@/game-session/application/create-game-session';
import { getGameSession } from '@/game-session/application/get-game-session';
import { updateGameSession } from '@/game-session/application/update-game-session';
import { deleteGameSession } from '@/game-session/application/delete-game-session';
import { updateGameSessionStatus } from '@/game-session/application/update-game-session-status';
import { listMembers } from '@/game-session/application/list-members';
import { joinGameSession } from '@/game-session/application/join-game-session';
import { joinAsGuest } from '@/game-session/application/join-as-guest';
import { updateMember } from '@/game-session/application/update-member';
import { leaveGameSession } from '@/game-session/application/leave-game-session';
import { getGuestLink } from '@/game-session/application/get-guest-link';
import { getGuestLinkPreview } from '@/game-session/application/get-guest-link-preview';
import { getMyPlayMemo } from '@/game-session/application/get-my-play-memo';
import { upsertMyPlayMemo } from '@/game-session/application/upsert-my-play-memo';

type GameSessionRepo = ListGameSessionsRepository &
  CreateGameSessionRepository &
  GetGameSessionRepository &
  UpdateGameSessionRepository &
  DeleteGameSessionRepository &
  UpdateGameSessionStatusRepository &
  ListMembersRepository &
  JoinGameSessionRepository &
  JoinAsGuestRepository &
  UpdateMemberRepository &
  LeaveGameSessionRepository &
  GetGuestLinkRepository &
  GetGuestLinkPreviewRepository &
  GetMyPlayMemoRepository &
  UpsertMyPlayMemoRepository;

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
  listMembers(gameSessionId: string): Promise<ListMembersResult>;
  joinGameSession(
    gameSessionId: string,
    userId: string,
    input: JoinGameSessionInput,
  ): Promise<JoinGameSessionResult>;
  joinAsGuest(
    gameSessionId: string,
    token: string,
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
  getMyPlayMemo(
    gameSessionId: string,
    userId: string,
  ): Promise<GetMyPlayMemoResult>;
  upsertMyPlayMemo(
    gameSessionId: string,
    userId: string,
    input: UpsertGameSessionPlayMemoInput,
  ): Promise<UpsertMyPlayMemoResult>;
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
    token: string,
    input: JoinAsGuestInput,
  ): Promise<JoinAsGuestResult> =>
    joinAsGuest(repo, gameSessionId, token, input),
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
  getMyPlayMemo: (
    gameSessionId: string,
    userId: string,
  ): Promise<GetMyPlayMemoResult> => getMyPlayMemo(repo, gameSessionId, userId),
  upsertMyPlayMemo: (
    gameSessionId: string,
    userId: string,
    input: UpsertGameSessionPlayMemoInput,
  ): Promise<UpsertMyPlayMemoResult> =>
    upsertMyPlayMemo(repo, gameSessionId, userId, input),
});
