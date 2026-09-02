import type { HealthResponse } from '@taku-biyori/shared';
import type { GameSessionUseCases } from '@/game-session/application/use-cases';
import type { LobbyUseCases } from '@/lobby/application/use-cases';
import type { ProfileUseCases } from '@/profile/application/use-cases';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getHealth } from '@/health/application/get-health';
import { registerAuthRoute } from '@/auth/presentation/controller/routes/auth-route';
import { registerHealthRoute } from '@/health/presentation/controller/routes/health-route';
import { registerGameSessionRoute } from '@/game-session/presentation/controller/routes/game-session-route';
import { registerSeatRoute } from '@/game-session/presentation/controller/routes/seat-route';
import { registerPlayMemoRoute } from '@/game-session/presentation/controller/routes/play-memo-route';
import { registerProfileRoute } from '@/profile/presentation/controller/routes/profile-route';
import { registerLobbyRoute } from '@/lobby/presentation/controller/routes/lobby-route';
import { registerEntryRoute as registerLobbyEntryRoute } from '@/lobby/presentation/controller/routes/entry-route';
import { registerGuestLinkRoute as registerLobbyGuestLinkRoute } from '@/lobby/presentation/controller/routes/guest-link-route';
import { registerSchedulePollRoute as registerLobbySchedulePollRoute } from '@/lobby/presentation/controller/routes/schedule-poll-route';

export interface CreateAppOptions {
  frontendOrigin: string;
  authHandler: (request: Request) => Response | Promise<Response>;
  getHealth?: () => HealthResponse;
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  gameSession: GameSessionUseCases;
  profile: ProfileUseCases;
  lobby: LobbyUseCases;
}

export const createApp = (options: CreateAppOptions) => {
  const app = new Hono();
  const getHealthUseCase = options.getHealth ?? getHealth;

  app.use(
    '*',
    cors({
      origin: options.frontendOrigin,
      credentials: true,
    }),
  );

  registerHealthRoute(app, { getHealth: getHealthUseCase });
  registerAuthRoute(app, { authHandler: options.authHandler });
  registerGameSessionRoute(app, {
    getSession: options.getSession,
    listGameSessions: options.gameSession.listGameSessions,
    listLobbyGameSessions: options.gameSession.listLobbyGameSessions,
    getGameSession: options.gameSession.getGameSession,
    createGameSession: options.gameSession.createGameSession,
    updateGameSession: options.gameSession.updateGameSession,
    deleteGameSession: options.gameSession.deleteGameSession,
    updateGameSessionStatus: options.gameSession.updateGameSessionStatus,
  });
  registerSeatRoute(app, {
    getSession: options.getSession,
    listSeats: options.gameSession.listSeats,
    createSeat: options.gameSession.createSeat,
    updateCharacterAssignment: options.gameSession.updateCharacterAssignment,
    deleteSeat: options.gameSession.deleteSeat,
  });
  registerPlayMemoRoute(app, {
    getSession: options.getSession,
    getMyPlayMemo: options.gameSession.getMyPlayMemo,
    upsertMyPlayMemo: options.gameSession.upsertMyPlayMemo,
    updateMyPlayMemoVisibility: options.gameSession.updateMyPlayMemoVisibility,
    listSharedPlayMemos: options.gameSession.listSharedPlayMemos,
  });
  registerLobbyRoute(app, {
    getSession: options.getSession,
    listLobbies: options.lobby.listLobbies,
    createLobby: options.lobby.createLobby,
    getLobby: options.lobby.getLobby,
    updateLobby: options.lobby.updateLobby,
    deleteLobby: options.lobby.deleteLobby,
    updateLobbyStatus: options.lobby.updateLobbyStatus,
  });
  registerLobbyEntryRoute(app, {
    getSession: options.getSession,
    listEntries: options.lobby.listEntries,
    joinLobby: options.lobby.joinLobby,
    joinAsGuest: options.lobby.joinAsGuest,
    leaveLobby: options.lobby.leaveLobby,
  });
  registerLobbyGuestLinkRoute(app, {
    getSession: options.getSession,
    getGuestLink: options.lobby.getGuestLink,
    regenerateGuestLink: options.lobby.regenerateGuestLink,
  });
  registerLobbySchedulePollRoute(app, {
    getSession: options.getSession,
    listSchedulePolls: options.lobby.listSchedulePolls,
    getSchedulePoll: options.lobby.getSchedulePoll,
    createSchedulePoll: options.lobby.createSchedulePoll,
    replaceCandidateDates: options.lobby.replaceCandidateDates,
    upsertScheduleAnswers: options.lobby.upsertScheduleAnswers,
    upsertGuestScheduleAnswers: options.lobby.upsertGuestScheduleAnswers,
  });
  registerProfileRoute(app, {
    getSession: options.getSession,
    getProfile: options.profile.getProfile,
    updateProfile: options.profile.updateProfile,
  });

  return app;
};
