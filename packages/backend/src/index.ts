import 'dotenv/config';
import { serve } from '@hono/node-server';
import { fileURLToPath } from 'node:url';
import { createApp } from '@/app/presentation/controller/create-app';
import { createAuth } from '@/auth/infrastructure/create-auth';
import { createDatabase } from '@/system/infrastructure/database/client';
import { loadBackendConfig } from '@/system/infrastructure/config/env';
import { createGameSessionRepository } from '@/game-session/infrastructure/game-session-repository';
import { createGameSessionUseCases } from '@/game-session/application/use-cases';
import { createProfileRepository } from '@/profile/infrastructure/profile-repository';
import { createProfileUseCases } from '@/profile/application/use-cases';

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

const app = createApp({
  frontendOrigin: config.frontendOrigin,
  authHandler: (request) => auth.handler(request),
  getSession: (headers) => auth.api.getSession({ headers }),
  gameSession: createGameSessionUseCases(createGameSessionRepository(db)),
  profile: createProfileUseCases(createProfileRepository(db)),
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
