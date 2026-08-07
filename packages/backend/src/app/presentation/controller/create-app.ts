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
import { registerMemberRoute } from '@/game-session/presentation/controller/routes/member-route';
import { registerGuestLinkRoute } from '@/game-session/presentation/controller/routes/guest-link-route';
import { registerPlayMemoRoute } from '@/game-session/presentation/controller/routes/play-memo-route';
import { registerProfileRoute } from '@/profile/presentation/controller/routes/profile-route';
import { registerLobbyRoute } from '@/lobby/presentation/controller/routes/lobby-route';
import { registerMemberRoute as registerLobbyMemberRoute } from '@/lobby/presentation/controller/routes/member-route';
import { registerGuestLinkRoute as registerLobbyGuestLinkRoute } from '@/lobby/presentation/controller/routes/guest-link-route';
import { registerAvailabilityDateRoute as registerLobbyAvailabilityDateRoute } from '@/lobby/presentation/controller/routes/availability-date-route';

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
    createGameSession: options.gameSession.createGameSession,
    getGameSession: options.gameSession.getGameSession,
    updateGameSession: options.gameSession.updateGameSession,
    deleteGameSession: options.gameSession.deleteGameSession,
    updateGameSessionStatus: options.gameSession.updateGameSessionStatus,
  });
  registerMemberRoute(app, {
    getSession: options.getSession,
    listMembers: options.gameSession.listMembers,
    joinGameSession: options.gameSession.joinGameSession,
    joinAsGuest: options.gameSession.joinAsGuest,
    updateMember: options.gameSession.updateMember,
    leaveGameSession: options.gameSession.leaveGameSession,
  });
  registerGuestLinkRoute(app, {
    getSession: options.getSession,
    getGuestLink: options.gameSession.getGuestLink,
    getGuestLinkPreview: options.gameSession.getGuestLinkPreview,
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
    confirmLobby: options.lobby.confirmLobby,
  });
  registerLobbyMemberRoute(app, {
    getSession: options.getSession,
    listMembers: options.lobby.listMembers,
    joinLobby: options.lobby.joinLobby,
    joinAsGuest: options.lobby.joinAsGuest,
    leaveLobby: options.lobby.leaveLobby,
  });
  registerLobbyGuestLinkRoute(app, {
    getSession: options.getSession,
    getGuestLink: options.lobby.getGuestLink,
  });
  registerLobbyAvailabilityDateRoute(app, {
    getSession: options.getSession,
    listAvailabilityDates: options.lobby.listAvailabilityDates,
    addAvailabilityDate: options.lobby.addAvailabilityDate,
    bulkUpdateAvailabilityDates: options.lobby.bulkUpdateAvailabilityDates,
    deleteAvailabilityDate: options.lobby.deleteAvailabilityDate,
    updateAvailabilityDateResponse:
      options.lobby.updateAvailabilityDateResponse,
    updateGuestAvailabilityDateResponse:
      options.lobby.updateGuestAvailabilityDateResponse,
  });
  registerProfileRoute(app, {
    getSession: options.getSession,
    getProfile: options.profile.getProfile,
    updateProfile: options.profile.updateProfile,
  });

  return app;
};
