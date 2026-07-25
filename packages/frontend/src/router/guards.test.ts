import { describe, it, expect } from 'vitest';
import type { RouteLocationNormalized } from 'vue-router';
import { resolveAuthRedirect } from '@/router/guards';

function makeRoute(
  overrides: Partial<RouteLocationNormalized>,
): RouteLocationNormalized {
  return {
    name: 'profile-setting',
    path: '/profile/setting',
    meta: {},
    ...overrides,
  } as RouteLocationNormalized;
}

describe('resolveAuthRedirect', () => {
  it('requiresAuth のルートに未ログインでアクセスすると /login へリダイレクトする', () => {
    // Arrange
    const to = makeRoute({ meta: { requiresAuth: true } });

    // Act
    const result = resolveAuthRedirect(to, false);

    // Assert
    expect(result).toEqual({
      name: 'login',
      query: { 'next-page': 'profile-setting' },
    });
  });

  it('requiresAuth のルートでもログイン済みならリダイレクトしない', () => {
    // Arrange
    const to = makeRoute({ meta: { requiresAuth: true } });

    // Act
    const result = resolveAuthRedirect(to, true);

    // Assert
    expect(result).toBeNull();
  });

  it('requiresAuth でないルートは未ログインでもリダイレクトしない', () => {
    // Arrange
    const to = makeRoute({ name: 'top', path: '/', meta: {} });

    // Act
    const result = resolveAuthRedirect(to, false);

    // Assert
    expect(result).toBeNull();
  });

  it('ルート名が無い場合は next-page を付けずに /login へリダイレクトする', () => {
    // Arrange
    const to = makeRoute({ name: undefined, meta: { requiresAuth: true } });

    // Act
    const result = resolveAuthRedirect(to, false);

    // Assert
    expect(result).toEqual({ name: 'login', query: {} });
  });
});
