/**
 * バックエンドで使う環境変数をまとめて読み込みます。
 * 依存を関数の外に出さず、テストでは任意の値を渡せるようにします。
 */
export interface BackendConfig {
  port: number;
  frontendOrigin: string;
  databaseUrl: string;
  betterAuthSecret: string;
  betterAuthUrl: string;
  googleClientId?: string;
  googleClientSecret?: string;
}

const requireEnv = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
};

const parsePort = (value: string | undefined): number => {
  const port = Number.parseInt(value ?? '3000', 10);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer');
  }

  return port;
};

export const loadBackendConfig = (
  env: NodeJS.ProcessEnv = process.env,
): BackendConfig => ({
  port: parsePort(env.PORT),
  frontendOrigin: env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl: requireEnv('DATABASE_URL', env.DATABASE_URL),
  betterAuthSecret: requireEnv('BETTER_AUTH_SECRET', env.BETTER_AUTH_SECRET),
  betterAuthUrl: env.BETTER_AUTH_URL || 'http://localhost:3000',
  googleClientId: env.GOOGLE_CLIENT_ID,
  googleClientSecret: env.GOOGLE_CLIENT_SECRET,
});
