import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGuestLink } from '@/features/GameSession/Detail/useGuestLink';

vi.mock('@/api/game-session', () => ({
  getGuestLink: vi.fn(),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}));

import { getGuestLink } from '@/api/game-session';

const SESSION_ID = 'session-1';
const TOKEN = 'guest-token-abc';

const writeText = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  writeText.mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  // window.location.origin を固定する
  Object.defineProperty(window, 'location', {
    value: { origin: 'https://example.com' },
    writable: true,
  });
});

describe('copyGuestLink', () => {
  it('getGuestLink を gameSessionId で呼び出す', async () => {
    // Arrange
    vi.mocked(getGuestLink).mockResolvedValue({ token: TOKEN });
    const { copyGuestLink } = useGuestLink(SESSION_ID);

    // Act
    await copyGuestLink();

    // Assert
    expect(getGuestLink).toHaveBeenCalledWith(SESSION_ID);
  });

  it('取得したトークンから招待リンクを組み立ててクリップボードへコピーする', async () => {
    // Arrange
    vi.mocked(getGuestLink).mockResolvedValue({ token: TOKEN });
    const { copyGuestLink, guestLink } = useGuestLink(SESSION_ID);

    // Act
    await copyGuestLink();

    // Assert
    const expected = `https://example.com/game-sessions/${SESSION_ID}?token=${TOKEN}`;
    expect(guestLink.value).toBe(expected);
    expect(writeText).toHaveBeenCalledWith(expected);
  });

  it('成功時に success トーストを表示する', async () => {
    // Arrange
    vi.mocked(getGuestLink).mockResolvedValue({ token: TOKEN });
    const { copyGuestLink } = useGuestLink(SESSION_ID);

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
    const { copyGuestLink, loading } = useGuestLink(SESSION_ID);

    // Act
    await copyGuestLink();

    // Assert
    expect(loading.value).toBe(false);
  });

  it('API エラー時に error トーストを表示する', async () => {
    // Arrange
    vi.mocked(getGuestLink).mockRejectedValue(new Error('サーバーエラー'));
    const { copyGuestLink } = useGuestLink(SESSION_ID);

    // Act
    await copyGuestLink();

    // Assert
    expect(mockToastError).toHaveBeenCalledWith(
      'ゲストリンクの取得に失敗しました',
    );
  });

  it('loading 中の重複呼び出しは無視する', async () => {
    // Arrange
    let resolve!: (v: { token: string }) => void;
    vi.mocked(getGuestLink).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { copyGuestLink } = useGuestLink(SESSION_ID);

    // Act
    const first = copyGuestLink();
    await copyGuestLink();
    resolve({ token: TOKEN });
    await first;

    // Assert
    expect(getGuestLink).toHaveBeenCalledTimes(1);
  });
});
