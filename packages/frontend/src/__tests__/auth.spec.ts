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
    vi.mocked(authClient.getSession).mockResolvedValue({
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
    });

    const store = useAuthStore();
    await store.initSession();

    expect(store.user?.id).toBe('user-1');
    expect(store.error).toBeNull();
  });
});
