import { describe, expect, it, vi } from 'vitest';

vi.mock('better-auth', () => ({
  betterAuth: vi.fn((config) => config),
}));

vi.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: vi.fn(() => ({ adapter: true })),
}));

import { createAuth } from '@/auth/infrastructure/create-auth.js';

describe('createAuth', () => {
  const baseOptions = {
    db: {} as never,
    secret: 'secret',
    baseURL: 'http://localhost:3000',
    trustedOrigin: 'http://localhost:5173',
  };

  it('throws when only googleClientId is provided', () => {
    expect(() =>
      createAuth({
        ...baseOptions,
        googleClientId: 'google-client-id',
      }),
    ).toThrow(
      'Both googleClientId and googleClientSecret must be provided together',
    );
  });

  it('throws when only googleClientSecret is provided', () => {
    expect(() =>
      createAuth({
        ...baseOptions,
        googleClientSecret: 'google-client-secret',
      }),
    ).toThrow(
      'Both googleClientId and googleClientSecret must be provided together',
    );
  });

  it('returns the google provider only when both values are provided', () => {
    // `betterAuth` はモックしており実行時には渡した config をそのまま返すが、
    // createAuth の型は本物の Auth<...> のままなので socialProviders が
    // 静的には見えない。テスト用にモックの実体形へキャストする。
    const auth = createAuth({
      ...baseOptions,
      googleClientId: 'google-client-id',
      googleClientSecret: 'google-client-secret',
    }) as unknown as { socialProviders: unknown };

    expect(auth.socialProviders).toEqual({
      google: {
        clientId: 'google-client-id',
        clientSecret: 'google-client-secret',
        disableDefaultScope: true,
        scope: ['openid', 'email'],
      },
    });
  });
});
