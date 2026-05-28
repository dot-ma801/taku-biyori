import 'dotenv/config';
import { serve } from '@hono/node-server';
import { fileURLToPath } from 'node:url';
import { createApp } from './app/presentation/controller/create-app';
import { createAuth } from './auth/infrastructure/create-auth';
import { createDatabase } from './system/infrastructure/database/client';
import { loadBackendConfig } from './system/infrastructure/config/env';

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
