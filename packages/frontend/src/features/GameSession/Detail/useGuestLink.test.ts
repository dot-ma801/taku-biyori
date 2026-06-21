import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useGuestLink } from '@/features/GameSession/Detail/useGuestLink';
import { GameSessionStatus } from '@taku-biyori/shared';

vi.mock('@/api/game-session', () => ({
  getGuestLink: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}));

import { getGuestLink } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';

const SESSION_ID = 'session-1';
const TOKEN = 'guest-token-abc';
const HOST_ID = 'host-1';
const OTHER_ID = 'other-1';

const writeText = vi.fn();

function setupAuthAs(userId: string | null) {
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: userId ? { id: userId } : null,
  } as ReturnType<typeof useAuthStore>);
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  setupAuthAs(HOST_ID);
  writeText.mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  // window.location.origin を固定する
  Object.defineProperty(window, 'location', {
    value: { origin: 'https://example.com' },
    writable: true,
  });
});

describe('canIssueGuestLink', () => {
  it('ホストかつ status が open のとき true', () => {
    // Act
    const { canIssueGuestLink } = useGuestLink(
      SESSION_ID,
      HOST_ID,
      GameSessionStatus.open,
    );

    // Assert
    expect(canIssueGuestLink.value).toBe(true);
  });

  it('ホスト以外のユーザーのとき false', () => {
    // Arrange: ログインユーザーがホストでない
    setupAuthAs(OTHER_ID);

    // Act
    const { canIssueGuestLink } = useGuestLink(
      SESSION_ID,
      HOST_ID,
      GameSessionStatus.open,
    );

    // Assert
    expect(canIssueGuestLink.value).toBe(false);
  });

  it('status が open 以外のとき false', () => {
    // Act
    const { canIssueGuestLink } = useGuestLink(
      SESSION_ID,
      HOST_ID,
      GameSessionStatus.scheduling,
    );

    // Assert
    expect(canIssueGuestLink.value).toBe(false);
  });

  it('未ログインのとき false', () => {
    // Arrange
    setupAuthAs(null);

    // Act
    const { canIssueGuestLink } = useGuestLink(
      SESSION_ID,
      HOST_ID,
      GameSessionStatus.open,
    );

    // Assert
    expect(canIssueGuestLink.value).toBe(false);
  });
});

describe('copyGuestLink', () => {
  it('getGuestLink を gameSessionId で呼び出す', async () => {
    // Arrange
    vi.mocked(getGuestLink).mockResolvedValue({ token: TOKEN });
    const { copyGuestLink } = useGuestLink(
      SESSION_ID,
      HOST_ID,
      GameSessionStatus.open,
    );

    // Act
    await copyGuestLink();

    // Assert
    expect(getGuestLink).toHaveBeenCalledWith(SESSION_ID);
  });

  it('取得したトークンから招待リンクを組み立ててクリップボードへコピーする', async () => {
    // Arrange
    vi.mocked(getGuestLink).mockResolvedValue({ token: TOKEN });
    const { copyGuestLink } = useGuestLink(
      SESSION_ID,
      HOST_ID,
      GameSessionStatus.open,
    );

    // Act
    await copyGuestLink();

    // Assert
    const expected = `https://example.com/game-sessions/${SESSION_ID}?token=${TOKEN}`;
    expect(writeText).toHaveBeenCalledWith(expected);
  });

  it('成功時に success トーストを表示する', async () => {
    // Arrange
    vi.mocked(getGuestLink).mockResolvedValue({ token: TOKEN });
    const { copyGuestLink } = useGuestLink(
      SESSION_ID,
      HOST_ID,
      GameSessionStatus.open,
    );

    // Act
    await copyGuestLink();

    // Assert
    expect(mockToastSuccess).toHaveBeenCalledWith(
      'ゲストリンクをコピーしました',
    );
  });

  it('成功後に loading が false に戻る', async () => {
    // Arrange
    vi.mocked(getGuestLink).mockResolvedValue({ token: TOKEN });
    const { copyGuestLink, loading } = useGuestLink(
      SESSION_ID,
      HOST_ID,
      GameSessionStatus.open,
    );

    // Act
    await copyGuestLink();

    // Assert
    expect(loading.value).toBe(false);
  });

  it('API エラー時に error トーストを表示する', async () => {
    // Arrange
    vi.mocked(getGuestLink).mockRejectedValue(new Error('サーバーエラー'));
    const { copyGuestLink } = useGuestLink(
      SESSION_ID,
      HOST_ID,
      GameSessionStatus.open,
    );

    // Act
    await copyGuestLink();

    // Assert
    expect(mockToastError).toHaveBeenCalledWith(
      'ゲストリンクの取得に失敗しました',
    );
  });

  it('発行条件を満たさないとき（非ホスト）は API を呼ばない', async () => {
    // Arrange
    setupAuthAs(OTHER_ID);
    const { copyGuestLink } = useGuestLink(
      SESSION_ID,
      HOST_ID,
      GameSessionStatus.open,
    );

    // Act
    await copyGuestLink();

    // Assert
    expect(getGuestLink).not.toHaveBeenCalled();
  });

  it('loading 中の重複呼び出しは無視する', async () => {
    // Arrange
    let resolve!: (v: { token: string }) => void;
    vi.mocked(getGuestLink).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { copyGuestLink } = useGuestLink(
      SESSION_ID,
      HOST_ID,
      GameSessionStatus.open,
    );

    // Act
    const first = copyGuestLink();
    await copyGuestLink();
    resolve({ token: TOKEN });
    await first;

    // Assert
    expect(getGuestLink).toHaveBeenCalledTimes(1);
  });
});
