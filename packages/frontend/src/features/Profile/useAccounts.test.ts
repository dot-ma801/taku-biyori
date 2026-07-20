import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAccounts } from '@/features/Profile/useAccounts';

vi.mock('@/lib/auth', () => ({
  listAccounts: vi.fn(),
}));

// composable を component 外で呼ぶため onMounted は no-op にし、
// 初期ロードはテスト側で明示的に fetch() を呼んで再現する。
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>();
  return { ...actual, onMounted: vi.fn() };
});

import { listAccounts } from '@/lib/auth';

function makeAccount(providerId: string) {
  return {
    id: `account-${providerId}`,
    providerId,
    accountId: `account-id-${providerId}`,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fetch', () => {
  it('credential プロバイダーのアカウントがあれば hasPassword が true になる', async () => {
    // Arrange
    vi.mocked(listAccounts).mockResolvedValue({
      data: [makeAccount('credential')],
      error: null,
    });

    // Act
    const { hasPassword, fetch } = useAccounts();
    await fetch();

    // Assert
    expect(hasPassword.value).toBe(true);
  });

  it('credential プロバイダーのアカウントが無ければ hasPassword が false になる', async () => {
    // Arrange
    vi.mocked(listAccounts).mockResolvedValue({
      data: [makeAccount('google')],
      error: null,
    });

    // Act
    const { hasPassword, fetch } = useAccounts();
    await fetch();

    // Assert
    expect(hasPassword.value).toBe(false);
  });

  it('API がエラーを返した場合は hasPassword を false のままにする', async () => {
    // Arrange
    vi.mocked(listAccounts).mockResolvedValue({
      data: null,
      error: { message: 'failed' },
    });

    // Act
    const { hasPassword, fetch } = useAccounts();
    await fetch();

    // Assert
    expect(hasPassword.value).toBe(false);
  });

  it('取得中は loading が true になる', async () => {
    // Arrange
    let resolveList!: (value: {
      data: ReturnType<typeof makeAccount>[] | null;
      error: null;
    }) => void;
    vi.mocked(listAccounts).mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve;
      }) as ReturnType<typeof listAccounts>,
    );
    const { loading, fetch } = useAccounts();

    // Act
    const promise = fetch();
    expect(loading.value).toBe(true);
    resolveList({ data: [], error: null });
    await promise;

    // Assert
    expect(loading.value).toBe(false);
  });

  it('例外が発生した場合も hasPassword を false のままにする', async () => {
    // Arrange
    vi.mocked(listAccounts).mockRejectedValue(new Error('network error'));

    // Act
    const { hasPassword, fetch } = useAccounts();
    await fetch();

    // Assert
    expect(hasPassword.value).toBe(false);
  });
});
