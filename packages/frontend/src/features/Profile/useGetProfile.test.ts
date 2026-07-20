import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGetProfile } from '@/features/Profile/useGetProfile';
import type { ProfileResponse } from '@taku-biyori/shared';

vi.mock('@/api/profile', () => ({
  getProfile: vi.fn(),
}));

// composable を component 外で呼ぶため onMounted は no-op にし、
// 初期ロードはテスト側で明示的に fetch() を呼んで再現する。
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>();
  return { ...actual, onMounted: vi.fn() };
});

import { getProfile } from '@/api/profile';
import { ApiError } from '@/lib/api-client';

function makeProfile(
  overrides: Partial<ProfileResponse> = {},
): ProfileResponse {
  return {
    id: 'user-1',
    name: 'テストユーザー',
    email: 'test@example.com',
    image: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fetch', () => {
  it('取得したプロフィールを profile に格納する', async () => {
    // Arrange
    const profile = makeProfile();
    vi.mocked(getProfile).mockResolvedValue(profile);

    // Act
    const { profile: state, fetch } = useGetProfile();
    await fetch();

    // Assert
    expect(getProfile).toHaveBeenCalled();
    expect(state.value).toEqual(profile);
  });

  it('取得中は loading が true になる', async () => {
    // Arrange
    let resolveGet!: (profile: ProfileResponse) => void;
    vi.mocked(getProfile).mockReturnValue(
      new Promise((resolve) => {
        resolveGet = resolve;
      }),
    );
    const { loading, fetch } = useGetProfile();

    // Act
    const promise = fetch();
    expect(loading.value).toBe(true);
    resolveGet(makeProfile());
    await promise;

    // Assert
    expect(loading.value).toBe(false);
  });

  it('ApiError が発生した場合はそのメッセージを errorMessage に格納する', async () => {
    // Arrange
    vi.mocked(getProfile).mockRejectedValue(new ApiError(404, 'Not Found'));

    // Act
    const { errorMessage, fetch } = useGetProfile();
    await fetch();

    // Assert
    expect(errorMessage.value).toBe('Not Found');
  });

  it('ApiError 以外のエラーが発生した場合は汎用メッセージを errorMessage に格納する', async () => {
    // Arrange
    vi.mocked(getProfile).mockRejectedValue(new Error('network down'));

    // Act
    const { errorMessage, fetch } = useGetProfile();
    await fetch();

    // Assert
    expect(errorMessage.value).toBe('エラーが発生しました');
  });
});

describe('patchProfile', () => {
  it('取得済みの profile を部分的に差し替える', async () => {
    // Arrange
    vi.mocked(getProfile).mockResolvedValue(makeProfile());
    const { profile, fetch, patchProfile } = useGetProfile();
    await fetch();

    // Act
    patchProfile({ name: '新しい名前' });

    // Assert
    expect(profile.value?.name).toBe('新しい名前');
    expect(profile.value?.id).toBe('user-1');
  });

  it('profile 未ロード時は何もしない', () => {
    // Arrange
    const { profile, patchProfile } = useGetProfile();

    // Act
    patchProfile({ name: '新しい名前' });

    // Assert
    expect(profile.value).toBeNull();
  });
});
