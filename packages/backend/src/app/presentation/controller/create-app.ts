import type {
  HealthResponse,
  GameSessionListItem,
  GameSession,
  CreateGameSessionInput,
  UpdateGameSessionInput,
  UpdateGameSessionStatusInput,
} from '@taku-biyori/shared';
import type { GetGameSessionResult } from '@/game-session/application/get-game-session';
import type { UpdateGameSessionResult } from '@/game-session/application/update-game-session';
import type { DeleteGameSessionResult } from '@/game-session/application/delete-game-session';
import type { UpdateGameSessionStatusResult } from '@/game-session/application/update-game-session-status';
import type { ListAvailabilityDatesResult } from '@/game-session/application/list-availability-dates';
import type { AddAvailabilityDateResult } from '@/game-session/application/add-availability-date';
import type { DeleteAvailabilityDateResult } from '@/game-session/application/delete-availability-date';
import type { ConfirmAvailabilityDateResult } from '@/game-session/application/confirm-availability-date';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getHealth } from '@/health/application/get-health';
import { registerAuthRoute } from '@/auth/presentation/controller/routes/auth-route';
import { registerHealthRoute } from '@/health/presentation/controller/routes/health-route';
import { registerGameSessionRoute } from '@/game-session/presentation/controller/routes/game-session-route';
import { registerAvailabilityDateRoute } from '@/game-session/presentation/controller/routes/availability-date-route';

export interface CreateAppOptions {
  frontendOrigin: string;
  authHandler: (request: Request) => Response | Promise<Response>;
  getHealth?: () => HealthResponse;
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  listGameSessions: (userId: string) => Promise<GameSessionListItem[]>;
  createGameSession: (
    userId: string,
    input: CreateGameSessionInput,
  ) => Promise<GameSession>;
  getGameSession: (
    id: string,
    userId: string | null,
  ) => Promise<GetGameSessionResult>;
  updateGameSession: (
    id: string,
    userId: string,
    input: UpdateGameSessionInput,
  ) => Promise<UpdateGameSessionResult>;
  deleteGameSession: (
    id: string,
    userId: string,
  ) => Promise<DeleteGameSessionResult>;
  updateGameSessionStatus: (
    id: string,
    userId: string,
    input: UpdateGameSessionStatusInput,
  ) => Promise<UpdateGameSessionStatusResult>;
  listAvailabilityDates: (
    gameSessionId: string,
  ) => Promise<ListAvailabilityDatesResult>;
  addAvailabilityDate: (
    gameSessionId: string,
    userId: string,
    input: { date: string },
  ) => Promise<AddAvailabilityDateResult>;
  deleteAvailabilityDate: (
    dateId: string,
    userId: string,
  ) => Promise<DeleteAvailabilityDateResult>;
  confirmAvailabilityDate: (
    dateId: string,
    userId: string,
  ) => Promise<ConfirmAvailabilityDateResult>;
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
    listGameSessions: options.listGameSessions,
    createGameSession: options.createGameSession,
    getGameSession: options.getGameSession,
    updateGameSession: options.updateGameSession,
    deleteGameSession: options.deleteGameSession,
    updateGameSessionStatus: options.updateGameSessionStatus,
  });
  registerAvailabilityDateRoute(app, {
    getSession: options.getSession,
    listAvailabilityDates: options.listAvailabilityDates,
    addAvailabilityDate: options.addAvailabilityDate,
    deleteAvailabilityDate: options.deleteAvailabilityDate,
    confirmAvailabilityDate: options.confirmAvailabilityDate,
  });

  return app;
};
