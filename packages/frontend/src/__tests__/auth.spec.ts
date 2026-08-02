import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/lib/auth.js', () => ({
  authClient: {
    getSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

import { authClient } from '@/lib/auth.js';
import { useAuthStore } from '@/stores/auth';

const VALID_SESSION = {
  data: {
    user: {
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    session: {
      id: 'session-1',
      expiresAt: new Date('2026-01-02T00:00:00.000Z'),
      token: 'token-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  },
};

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('keeps schema validation errors when session parsing fails', async () => {
    vi.mocked(authClient.getSession).mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
        },
      },
    });

    const store = useAuthStore();
    await store.initSession();

    expect(store.user).toBeNull();
    expect(store.error).toContain('Invalid input');
  });

  it('clears error on a valid session', async () => {
    vi.mocked(authClient.getSession).mockResolvedValue(VALID_SESSION);

    const store = useAuthStore();
    await store.initSession();

    expect(store.user?.id).toBe('user-1');
    expect(store.error).toBeNull();
  });

  it('取得中に initSession を重ねて呼んでも通信は 1 回にまとまる', async () => {
    // Arrange
    vi.mocked(authClient.getSession).mockResolvedValue(VALID_SESSION);
    const store = useAuthStore();

    // Act
    await Promise.all([store.initSession(), store.initSession()]);

    // Assert
    expect(authClient.getSession).toHaveBeenCalledTimes(1);
  });

  it('取得完了後の initSession はセッションを取り直す', async () => {
    // Arrange
    vi.mocked(authClient.getSession).mockResolvedValue(VALID_SESSION);
    const store = useAuthStore();
    await store.initSession();

    // Act
    await store.initSession();

    // Assert
    expect(authClient.getSession).toHaveBeenCalledTimes(2);
  });

  it('ensureSessionReady は復元済みなら通信せずに解決する', async () => {
    // Arrange
    vi.mocked(authClient.getSession).mockResolvedValue(VALID_SESSION);
    const store = useAuthStore();
    await store.initSession();

    // Act
    await store.ensureSessionReady();

    // Assert
    expect(authClient.getSession).toHaveBeenCalledTimes(1);
    expect(store.initialized).toBe(true);
  });

  it('ensureSessionReady は未復元なら取得の完了を待つ', async () => {
    // Arrange
    vi.mocked(authClient.getSession).mockResolvedValue(VALID_SESSION);
    const store = useAuthStore();

    // Act
    store.initSession();
    await store.ensureSessionReady();

    // Assert
    expect(authClient.getSession).toHaveBeenCalledTimes(1);
    expect(store.isAuthenticated).toBe(true);
  });
});
