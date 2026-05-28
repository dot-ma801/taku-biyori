import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Database } from '../../system/infrastructure/database/client';
import * as schema from '../../system/infrastructure/database/schema';

export interface CreateAuthOptions {
  db: Database;
  secret: string;
  baseURL: string;
  trustedOrigin: string;
  googleClientId?: string;
  googleClientSecret?: string;
}

/**
 * Better Auth の設定をまとめて生成するファクトリです。
 * 外部依存はここに閉じ込め、上位層はハンドラだけを扱えるようにします。
 */
export const createAuth = (options: CreateAuthOptions) => {
  const hasGoogleClientId = options.googleClientId !== undefined;
  const hasGoogleClientSecret = options.googleClientSecret !== undefined;

  if (hasGoogleClientId !== hasGoogleClientSecret) {
    throw new Error(
      'Both googleClientId and googleClientSecret must be provided together',
    );
  }

  const socialProviders = hasGoogleClientId
    ? {
        google: {
          clientId: options.googleClientId!,
          clientSecret: options.googleClientSecret!,
          disableDefaultScope: true,
          scope: ['openid', 'email'],
        },
      }
    : {};

  return betterAuth({
    database: drizzleAdapter(options.db, {
      provider: 'pg',
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    secret: options.secret,
    baseURL: options.baseURL,
    basePath: '/api/auth',
    trustedOrigins: [options.trustedOrigin],
    plugins: [],
    socialProviders,
  });
};
