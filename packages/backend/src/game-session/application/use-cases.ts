import type {
  LegacyGameSessionListItem,
  LegacyUpdateGameSessionInput,
  LegacyUpdateGameSessionStatusInput,
  JoinGameSessionInput,
  UpdateMemberInput,
  UpsertGameSessionPlayMemoInput,
  UpdateGameSessionPlayMemoVisibilityInput,
} from '@taku-biyori/shared';
import type { GetGameSessionResult } from '@/game-session/application/get-game-session';
import type { UpdateGameSessionResult } from '@/game-session/application/update-game-session';
import type { DeleteGameSessionResult } from '@/game-session/application/delete-game-session';
import type { UpdateGameSessionStatusResult } from '@/game-session/application/update-game-session-status';
import type { ListMembersResult } from '@/game-session/application/list-members';
import type { JoinGameSessionResult } from '@/game-session/application/join-game-session';
import type { UpdateMemberResult } from '@/game-session/application/update-member';
import type { LeaveGameSessionResult } from '@/game-session/application/leave-game-session';
import type { GetMyPlayMemoResult } from '@/game-session/application/get-my-play-memo';
import type { UpsertMyPlayMemoResult } from '@/game-session/application/upsert-my-play-memo';
import type { UpdateMyPlayMemoVisibilityResult } from '@/game-session/application/update-my-play-memo-visibility';
import type { ListSharedPlayMemosResult } from '@/game-session/application/list-shared-play-memos';
import type { ListGameSessionsRepository } from '@/game-session/application/list-game-sessions';
import type { GetGameSessionRepository } from '@/game-session/application/get-game-session';
import type { UpdateGameSessionRepository } from '@/game-session/application/update-game-session';
import type { DeleteGameSessionRepository } from '@/game-session/application/delete-game-session';
import type { UpdateGameSessionStatusRepository } from '@/game-session/application/update-game-session-status';
import type { ListMembersRepository } from '@/game-session/application/list-members';
import type { JoinGameSessionRepository } from '@/game-session/application/join-game-session';
import type { UpdateMemberRepository } from '@/game-session/application/update-member';
import type { LeaveGameSessionRepository } from '@/game-session/application/leave-game-session';
import type { GetMyPlayMemoRepository } from '@/game-session/application/get-my-play-memo';
import type { UpsertMyPlayMemoRepository } from '@/game-session/application/upsert-my-play-memo';
import type { UpdateMyPlayMemoVisibilityRepository } from '@/game-session/application/update-my-play-memo-visibility';
import type { ListSharedPlayMemosRepository } from '@/game-session/application/list-shared-play-memos';
import { listGameSessions } from '@/game-session/application/list-game-sessions';
import { getGameSession } from '@/game-session/application/get-game-session';
import { updateGameSession } from '@/game-session/application/update-game-session';
import { deleteGameSession } from '@/game-session/application/delete-game-session';
import { updateGameSessionStatus } from '@/game-session/application/update-game-session-status';
import { listMembers } from '@/game-session/application/list-members';
import { joinGameSession } from '@/game-session/application/join-game-session';
import { updateMember } from '@/game-session/application/update-member';
import { leaveGameSession } from '@/game-session/application/leave-game-session';
import { getMyPlayMemo } from '@/game-session/application/get-my-play-memo';
import { upsertMyPlayMemo } from '@/game-session/application/upsert-my-play-memo';
import { updateMyPlayMemoVisibility } from '@/game-session/application/update-my-play-memo-visibility';
import { listSharedPlayMemos } from '@/game-session/application/list-shared-play-memos';

type GameSessionRepo = ListGameSessionsRepository &
  GetGameSessionRepository &
  UpdateGameSessionRepository &
  DeleteGameSessionRepository &
  UpdateGameSessionStatusRepository &
  ListMembersRepository &
  JoinGameSessionRepository &
  UpdateMemberRepository &
  LeaveGameSessionRepository &
  GetMyPlayMemoRepository &
  UpsertMyPlayMemoRepository &
  UpdateMyPlayMemoVisibilityRepository &
  ListSharedPlayMemosRepository;

export interface GameSessionUseCases {
  listGameSessions(userId: string): Promise<LegacyGameSessionListItem[]>;
  getGameSession(
    id: string,
    userId: string | null,
  ): Promise<GetGameSessionResult>;
  updateGameSession(
    id: string,
    userId: string,
    input: LegacyUpdateGameSessionInput,
  ): Promise<UpdateGameSessionResult>;
  deleteGameSession(
    id: string,
    userId: string,
  ): Promise<DeleteGameSessionResult>;
  updateGameSessionStatus(
    id: string,
    userId: string,
    input: LegacyUpdateGameSessionStatusInput,
  ): Promise<UpdateGameSessionStatusResult>;
  listMembers(gameSessionId: string): Promise<ListMembersResult>;
  joinGameSession(
    gameSessionId: string,
    userId: string,
    input: JoinGameSessionInput,
  ): Promise<JoinGameSessionResult>;
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
  repo: GameSessionRepo,
): GameSessionUseCases => ({
  listGameSessions: (userId: string): Promise<LegacyGameSessionListItem[]> =>
    listGameSessions(repo, userId),
  getGameSession: (
    id: string,
    userId: string | null,
  ): Promise<GetGameSessionResult> => getGameSession(repo, id, userId),
  updateGameSession: (
    id: string,
    userId: string,
    input: LegacyUpdateGameSessionInput,
  ): Promise<UpdateGameSessionResult> =>
    updateGameSession(repo, id, userId, input),
  deleteGameSession: (
    id: string,
    userId: string,
  ): Promise<DeleteGameSessionResult> => deleteGameSession(repo, id, userId),
  updateGameSessionStatus: (
    id: string,
    userId: string,
    input: LegacyUpdateGameSessionStatusInput,
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
  updateMyPlayMemoVisibility: (
    gameSessionId: string,
    userId: string,
    input: UpdateGameSessionPlayMemoVisibilityInput,
  ): Promise<UpdateMyPlayMemoVisibilityResult> =>
    updateMyPlayMemoVisibility(repo, gameSessionId, userId, input),
  listSharedPlayMemos: (
    gameSessionId: string,
    userId: string | null,
  ): Promise<ListSharedPlayMemosResult> =>
    listSharedPlayMemos(repo, gameSessionId, userId),
});
