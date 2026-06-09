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
import { updateGameSessionStatus } from '@/game-session/application/update-game-session-status';
import { listAvailabilityDates } from '@/game-session/application/list-availability-dates';
import { addAvailabilityDate } from '@/game-session/application/add-availability-date';
import { deleteAvailabilityDate } from '@/game-session/application/delete-availability-date';
import { confirmAvailabilityDate } from '@/game-session/application/confirm-availability-date';
import { bulkUpdateAvailabilityDates } from '@/game-session/application/bulk-update-availability-dates';
import { updateAvailabilityDateResponse } from '@/game-session/application/update-availability-date-response';
import { listMembers } from '@/game-session/application/list-members';
import { joinGameSession } from '@/game-session/application/join-game-session';
import { joinAsGuest } from '@/game-session/application/join-as-guest';
import { updateMember } from '@/game-session/application/update-member';
import { leaveGameSession } from '@/game-session/application/leave-game-session';

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
  getGameSession: (id, userId) => getGameSession(gameSessionRepo, id, userId),
  updateGameSession: (id, userId, input) =>
    updateGameSession(gameSessionRepo, id, userId, input),
  deleteGameSession: (id, userId) =>
    deleteGameSession(gameSessionRepo, id, userId),
  updateGameSessionStatus: (id, userId, input) =>
    updateGameSessionStatus(gameSessionRepo, id, userId, input),
  listAvailabilityDates: (gameSessionId) =>
    listAvailabilityDates(gameSessionRepo, gameSessionId),
  addAvailabilityDate: (gameSessionId, userId, input) =>
    addAvailabilityDate(gameSessionRepo, gameSessionId, userId, input),
  deleteAvailabilityDate: (gameSessionId, dateId, userId) =>
    deleteAvailabilityDate(gameSessionRepo, gameSessionId, dateId, userId),
  confirmAvailabilityDate: (gameSessionId, dateId, userId) =>
    confirmAvailabilityDate(gameSessionRepo, gameSessionId, dateId, userId),
  bulkUpdateAvailabilityDates: (gameSessionId, userId, input) =>
    bulkUpdateAvailabilityDates(gameSessionRepo, gameSessionId, userId, input),
  updateAvailabilityDateResponse: (gameSessionId, dateId, userId, input) =>
    updateAvailabilityDateResponse(
      gameSessionRepo,
      gameSessionId,
      dateId,
      userId,
      input,
    ),
  listMembers: (gameSessionId) => listMembers(gameSessionRepo, gameSessionId),
  joinGameSession: (gameSessionId, userId, input) =>
    joinGameSession(gameSessionRepo, gameSessionId, userId, input),
  joinAsGuest: (gameSessionId, input) =>
    joinAsGuest(gameSessionRepo, gameSessionId, input),
  updateMember: (gameSessionId, memberId, userId, input) =>
    updateMember(gameSessionRepo, gameSessionId, memberId, userId, input),
  leaveGameSession: (gameSessionId, memberId, userId) =>
    leaveGameSession(gameSessionRepo, gameSessionId, memberId, userId),
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
