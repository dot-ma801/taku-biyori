import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useGuestLink } from '@/features/Lobby/Detail/composables/useGuestLink';
import { LobbyStatus } from '@taku-biyori/shared';

vi.mock('@/api/lobby', () => ({
  getLobbyGuestLink: vi.fn(),
  regenerateLobbyGuestLink: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}));

import { getLobbyGuestLink, regenerateLobbyGuestLink } from '@/api/lobby';
import { useAuthStore } from '@/stores/auth';

const LOBBY_ID = 'lobby-1';
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
      LOBBY_ID,
      HOST_ID,
      LobbyStatus.open,
    );

    // Assert
    expect(canIssueGuestLink.value).toBe(true);
  });

  it('ホスト以外のユーザーのとき false', () => {
    // Arrange: ログインユーザーがホストでない
    setupAuthAs(OTHER_ID);

    // Act
    const { canIssueGuestLink } = useGuestLink(
      LOBBY_ID,
      HOST_ID,
      LobbyStatus.open,
    );

    // Assert
    expect(canIssueGuestLink.value).toBe(false);
  });

  it('ホストかつ status が closed（受付終了）のとき true', () => {
    // Act
    const { canIssueGuestLink } = useGuestLink(
      LOBBY_ID,
      HOST_ID,
      LobbyStatus.closed,
    );

    // Assert
    expect(canIssueGuestLink.value).toBe(true);
  });

  it.each([{ status: LobbyStatus.draft }, { status: LobbyStatus.disbanded }])(
    'status が $status のとき false',
    ({ status }) => {
      // Act
      const { canIssueGuestLink } = useGuestLink(LOBBY_ID, HOST_ID, status);

      // Assert
      expect(canIssueGuestLink.value).toBe(false);
    },
  );

  it('未ログインのとき false', () => {
    // Arrange
    setupAuthAs(null);

    // Act
    const { canIssueGuestLink } = useGuestLink(
      LOBBY_ID,
      HOST_ID,
      LobbyStatus.open,
    );

    // Assert
    expect(canIssueGuestLink.value).toBe(false);
  });
});

describe('copyGuestLink', () => {
  it('getLobbyGuestLink を lobbyId で呼び出す', async () => {
    // Arrange
    vi.mocked(getLobbyGuestLink).mockResolvedValue({ token: TOKEN });
    const { copyGuestLink } = useGuestLink(LOBBY_ID, HOST_ID, LobbyStatus.open);

    // Act
    await copyGuestLink();

    // Assert
    expect(getLobbyGuestLink).toHaveBeenCalledWith(LOBBY_ID);
  });

  it('取得したトークンから招待リンクを組み立ててクリップボードへコピーする', async () => {
    // Arrange
    vi.mocked(getLobbyGuestLink).mockResolvedValue({ token: TOKEN });
    const { copyGuestLink } = useGuestLink(LOBBY_ID, HOST_ID, LobbyStatus.open);

    // Act
    await copyGuestLink();

    // Assert
    const expected = `https://example.com/lobbies/${LOBBY_ID}?token=${TOKEN}`;
    expect(writeText).toHaveBeenCalledWith(expected);
  });

  it('成功時に success トーストを表示する', async () => {
    // Arrange
    vi.mocked(getLobbyGuestLink).mockResolvedValue({ token: TOKEN });
    const { copyGuestLink } = useGuestLink(LOBBY_ID, HOST_ID, LobbyStatus.open);

    // Act
    await copyGuestLink();

    // Assert
    expect(mockToastSuccess).toHaveBeenCalledWith(
      'ゲストリンクをコピーしました',
    );
  });

  it('成功後に loading が false に戻る', async () => {
    // Arrange
    vi.mocked(getLobbyGuestLink).mockResolvedValue({ token: TOKEN });
    const { copyGuestLink, loading } = useGuestLink(
      LOBBY_ID,
      HOST_ID,
      LobbyStatus.open,
    );

    // Act
    await copyGuestLink();

    // Assert
    expect(loading.value).toBe(false);
  });

  it('API エラー時に error トーストを表示する', async () => {
    // Arrange
    vi.mocked(getLobbyGuestLink).mockRejectedValue(new Error('サーバーエラー'));
    const { copyGuestLink } = useGuestLink(LOBBY_ID, HOST_ID, LobbyStatus.open);

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
    const { copyGuestLink } = useGuestLink(LOBBY_ID, HOST_ID, LobbyStatus.open);

    // Act
    await copyGuestLink();

    // Assert
    expect(getLobbyGuestLink).not.toHaveBeenCalled();
  });

  it('loading 中の重複呼び出しは無視する', async () => {
    // Arrange
    let resolve!: (v: { token: string }) => void;
    vi.mocked(getLobbyGuestLink).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { copyGuestLink } = useGuestLink(LOBBY_ID, HOST_ID, LobbyStatus.open);

    // Act
    const first = copyGuestLink();
    await copyGuestLink();
    resolve({ token: TOKEN });
    await first;

    // Assert
    expect(getLobbyGuestLink).toHaveBeenCalledTimes(1);
  });
});

describe('regenerateGuestLink', () => {
  it('再発行 API を呼び、新しいリンクをコピーする', async () => {
    // Arrange
    setupAuthAs(HOST_ID);
    vi.mocked(regenerateLobbyGuestLink).mockResolvedValue({ token: 'new-tok' });
    const { regenerateGuestLink } = useGuestLink(
      LOBBY_ID,
      () => HOST_ID,
      () => LobbyStatus.open,
    );

    // Act
    await regenerateGuestLink();

    // Assert
    expect(regenerateLobbyGuestLink).toHaveBeenCalledWith(LOBBY_ID);
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('token=new-tok'),
    );
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it('ホスト以外は API を呼ばない', async () => {
    // Arrange
    setupAuthAs(OTHER_ID);
    const { regenerateGuestLink } = useGuestLink(
      LOBBY_ID,
      () => HOST_ID,
      () => LobbyStatus.open,
    );

    // Act
    await regenerateGuestLink();

    // Assert
    expect(regenerateLobbyGuestLink).not.toHaveBeenCalled();
  });

  it('解散済みのロビーでは API を呼ばない', async () => {
    // Arrange
    setupAuthAs(HOST_ID);
    const { regenerateGuestLink } = useGuestLink(
      LOBBY_ID,
      () => HOST_ID,
      () => LobbyStatus.disbanded,
    );

    // Act
    await regenerateGuestLink();

    // Assert
    expect(regenerateLobbyGuestLink).not.toHaveBeenCalled();
  });

  it('API エラー時に error トーストを表示する', async () => {
    // Arrange
    setupAuthAs(HOST_ID);
    vi.mocked(regenerateLobbyGuestLink).mockRejectedValue(new Error('failed'));
    const { regenerateGuestLink } = useGuestLink(
      LOBBY_ID,
      () => HOST_ID,
      () => LobbyStatus.open,
    );

    // Act
    await regenerateGuestLink();

    // Assert
    expect(mockToastError).toHaveBeenCalled();
  });
});

describe('コピーに失敗したときのリンクの受け渡し', () => {
  it('再発行に成功してコピーに失敗したら uncopiedLink にリンクを残す', async () => {
    // Arrange — 再発行は旧トークンを即座に無効にするので、
    // コピーに失敗したまま黙ると旧リンクも新リンクも共有できなくなる
    vi.mocked(regenerateLobbyGuestLink).mockResolvedValue({ token: TOKEN });
    writeText.mockRejectedValue(new Error('permission denied'));
    const { regenerateGuestLink, uncopiedLink } = useGuestLink(
      LOBBY_ID,
      HOST_ID,
      LobbyStatus.open,
    );

    // Act
    await regenerateGuestLink();

    // Assert
    expect(uncopiedLink.value).toBe(
      `https://example.com/lobbies/${LOBBY_ID}?token=${TOKEN}`,
    );
  });

  it('clipboard 未対応でも再発行済みのリンクを uncopiedLink に残す', async () => {
    // Arrange
    vi.mocked(regenerateLobbyGuestLink).mockResolvedValue({ token: TOKEN });
    Object.assign(navigator, { clipboard: undefined });
    const { regenerateGuestLink, uncopiedLink } = useGuestLink(
      LOBBY_ID,
      HOST_ID,
      LobbyStatus.open,
    );

    // Act
    await regenerateGuestLink();

    // Assert
    expect(uncopiedLink.value).toBe(
      `https://example.com/lobbies/${LOBBY_ID}?token=${TOKEN}`,
    );
  });

  it('コピーに失敗しても再発行自体は成功したと伝える', async () => {
    // Arrange — 「再発行に失敗しました」は事実と違う（トークンは差し替わっている）
    vi.mocked(regenerateLobbyGuestLink).mockResolvedValue({ token: TOKEN });
    writeText.mockRejectedValue(new Error('permission denied'));
    const { regenerateGuestLink } = useGuestLink(
      LOBBY_ID,
      HOST_ID,
      LobbyStatus.open,
    );

    // Act
    await regenerateGuestLink();

    // Assert
    expect(mockToastError).toHaveBeenCalledWith(
      '招待リンクを再発行しましたが、コピーに失敗しました。表示されたリンクをコピーしてください',
    );
  });

  it('再発行 API 自体が失敗したら uncopiedLink は空のまま', async () => {
    // Arrange — 旧トークンは生きているので新リンクを見せる必要はない
    vi.mocked(regenerateLobbyGuestLink).mockRejectedValue(new Error('500'));
    const { regenerateGuestLink, uncopiedLink } = useGuestLink(
      LOBBY_ID,
      HOST_ID,
      LobbyStatus.open,
    );

    // Act
    await regenerateGuestLink();

    // Assert
    expect(uncopiedLink.value).toBeNull();
    expect(mockToastError).toHaveBeenCalledWith(
      '招待リンクの再発行に失敗しました',
    );
  });

  it('取得のコピーに失敗したときも uncopiedLink にリンクを残す', async () => {
    // Arrange — clipboard 未対応の環境ではボタンを押し直しても永久にコピーできない
    vi.mocked(getLobbyGuestLink).mockResolvedValue({ token: TOKEN });
    writeText.mockRejectedValue(new Error('permission denied'));
    const { copyGuestLink, uncopiedLink } = useGuestLink(
      LOBBY_ID,
      HOST_ID,
      LobbyStatus.open,
    );

    // Act
    await copyGuestLink();

    // Assert
    expect(uncopiedLink.value).toBe(
      `https://example.com/lobbies/${LOBBY_ID}?token=${TOKEN}`,
    );
  });

  it('コピーに成功したら uncopiedLink はクリアされる', async () => {
    // Arrange
    vi.mocked(regenerateLobbyGuestLink)
      .mockResolvedValueOnce({ token: TOKEN })
      .mockResolvedValueOnce({ token: 'token-2' });
    writeText.mockRejectedValueOnce(new Error('permission denied'));
    const { regenerateGuestLink, uncopiedLink } = useGuestLink(
      LOBBY_ID,
      HOST_ID,
      LobbyStatus.open,
    );
    await regenerateGuestLink();
    expect(uncopiedLink.value).not.toBeNull();

    // Act — 2回目はコピーに成功する
    writeText.mockResolvedValue(undefined);
    await regenerateGuestLink();

    // Assert
    expect(uncopiedLink.value).toBeNull();
    expect(mockToastSuccess).toHaveBeenCalledWith(
      '招待リンクを再発行してコピーしました',
    );
  });
});
