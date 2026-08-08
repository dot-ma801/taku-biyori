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
    const auth = createAuth({
      ...baseOptions,
      googleClientId: 'google-client-id',
      googleClientSecret: 'google-client-secret',
    });

    expect(auth.socialProviders).toEqual({
      google: {
        clientId: 'google-client-id',
        clientSecret: 'google-client-secret',
        disableDefaultScope: true,
        scope: ['openid', 'email'],
      },
    });
  });

  // cookieCache がないと全ルートの getSession が毎回 DB を引く。
  // 関数と DB が離れているほど、この 1 往復がそのまま体感遅延になる。
  it('セッションの cookie キャッシュを有効にする', () => {
    // Arrange & Act
    const auth = createAuth(baseOptions);

    // Assert
    expect(auth.session?.cookieCache).toEqual({
      enabled: true,
      maxAge: 300,
    });
  });
});
