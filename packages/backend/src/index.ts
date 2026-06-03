import 'dotenv/config';
import { serve } from '@hono/node-server';
import { fileURLToPath } from 'node:url';
import { createApp } from '@/app/presentation/controller/create-app';
import { createAuth } from '@/auth/infrastructure/create-auth';
import { createDatabase } from '@/system/infrastructure/database/client';
import { loadBackendConfig } from '@/system/infrastructure/config/env';
import { createGameSessionRepository } from '@/game-session/infrastructure/game-session-repository';
import { listGameSessions } from '@/game-session/application/list-game-sessions';
import { createGameSession } from '@/game-session/application/create-game-session';
import { getGameSession } from '@/game-session/application/get-game-session';
import { updateGameSession } from '@/game-session/application/update-game-session';
import { deleteGameSession } from '@/game-session/application/delete-game-session';

const config = loadBackendConfig(process.env);
const db = createDatabase(config.databaseUrl);
const auth = createAuth({
  db,
  secret: config.betterAuthSecret,
  baseURL: config.betterAuthUrl,
  trustedOrigin: config.frontendOrigin,
  googleClientId: config.googleClientId,
  googleClientSecret: config.googleClientSecret,
});

const gameSessionRepo = createGameSessionRepository(db);

const app = createApp({
  frontendOrigin: config.frontendOrigin,
  authHandler: (request) => auth.handler(request),
  getSession: (headers) => auth.api.getSession({ headers }),
  listGameSessions: (userId) => listGameSessions(gameSessionRepo, userId),
  createGameSession: (userId, input) =>
    createGameSession(gameSessionRepo, userId, input),
  getGameSession: (id) => getGameSession(gameSessionRepo, id),
  updateGameSession: (id, userId, input) =>
    updateGameSession(gameSessionRepo, id, userId, input),
  deleteGameSession: (id, userId) =>
    deleteGameSession(gameSessionRepo, id, userId),
});

export default app;

const isDirectExecution = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  serve(
    {
      fetch: app.fetch,
      port: config.port,
    },
    (info) => {
      console.log(`Server is running on http://localhost:${info.port}`);
    },
  );
}
