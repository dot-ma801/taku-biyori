import type {
  HealthResponse,
  GameSessionListItem,
  GameSession,
  GameSessionDetail,
  CreateGameSessionInput,
  UpdateGameSessionInput,
} from '@taku-biyori/shared';
import type { UpdateGameSessionResult } from '@/game-session/application/update-game-session';
import type { DeleteGameSessionResult } from '@/game-session/application/delete-game-session';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getHealth } from '@/health/application/get-health';
import { registerAuthRoute } from '@/auth/presentation/controller/routes/auth-route';
import { registerHealthRoute } from '@/health/presentation/controller/routes/health-route';
import { registerGameSessionRoute } from '@/game-session/presentation/controller/routes/game-session-route';

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
  getGameSession: (id: string) => Promise<GameSessionDetail | null>;
  updateGameSession: (
    id: string,
    userId: string,
    input: UpdateGameSessionInput,
  ) => Promise<UpdateGameSessionResult>;
  deleteGameSession: (
    id: string,
    userId: string,
  ) => Promise<DeleteGameSessionResult>;
}

/**
 * Assemble the controller layer application.
 * Routing and request boundaries live here, while use cases stay inside.
 */
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
  });

  return app;
};
