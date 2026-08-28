import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useLobbyStatus } from '@/features/Lobby/Detail/composables/useLobbyStatus';
import { LobbyStatus } from '@taku-biyori/shared';
import type { Lobby, LobbyDetail } from '@taku-biyori/shared';

vi.mock('@/api/lobby', () => ({
  updateLobbyStatus: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}));

import { updateLobbyStatus } from '@/api/lobby';
import { useAuthStore } from '@/stores/auth';

const HOST_USER_ID = 'host-user-id';
const OTHER_USER_ID = 'other-user-id';
const LOBBY_ID = 'lobby-id';

function makeLobby(overrides: Partial<LobbyDetail> = {}): LobbyDetail {
  return {
    id: LOBBY_ID,
    title: 'テストロビー',
    status: LobbyStatus.draft,
    isPublished: false,
    hostUserId: HOST_USER_ID,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    members: [],
    ...overrides,
  };
}

function makeUpdatedLobby(status: LobbyStatus): Lobby {
  return {
    id: LOBBY_ID,
    title: 'テストロビー',
    status,
    isPublished: true,
    hostUserId: HOST_USER_ID,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

function setupAuthAs(userId: string) {
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: { id: userId },
  } as ReturnType<typeof useAuthStore>);
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('isHost', () => {
  it('currentUser.id が hostUserId と一致するとき true を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const lobby = ref(makeLobby());

    // Act
    const { isHost } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(isHost.value).toBe(true);
  });

  it('currentUser.id が hostUserId と異なるとき false を返す', () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);
    const lobby = ref(makeLobby());

    // Act
    const { isHost } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(isHost.value).toBe(false);
  });

  it('lobby が null のとき false を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const lobby = ref<LobbyDetail | null>(null);

    // Act
    const { isHost } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(isHost.value).toBe(false);
  });
});

describe('canPublish', () => {
  describe.each([
    { status: LobbyStatus.draft, expected: true },
    { status: LobbyStatus.open, expected: false },
    { status: LobbyStatus.scheduling, expected: false },
    { status: LobbyStatus.cancelled, expected: false },
  ])('ステータス policy (status=$status)', ({ status, expected }) => {
    it(`ホストのとき ${expected} を返す`, () => {
      // Arrange
      setupAuthAs(HOST_USER_ID);
      const lobby = ref(makeLobby({ status }));

      // Act
      const { canPublish } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

      // Assert
      expect(canPublish.value).toBe(expected);
    });
  });

  it('ホスト以外は status が draft でも false を返す', () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));

    // Act
    const { canPublish } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(canPublish.value).toBe(false);
  });

  it('lobby が null のとき false を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const lobby = ref<LobbyDetail | null>(null);

    // Act
    const { canPublish } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(canPublish.value).toBe(false);
  });
});

describe('canCancel', () => {
  // UI 仕様: 未公開（draft）の募集枠に「募集中止」ボタンは出さない。
  // API 上は draft からの中止も許可される（shared の LOBBY_ACTION_POLICIES 参照）
  describe.each([
    { status: LobbyStatus.draft, expected: false },
    { status: LobbyStatus.open, expected: true },
    { status: LobbyStatus.scheduling, expected: true },
    { status: LobbyStatus.cancelled, expected: false },
  ])('ステータス policy (status=$status)', ({ status, expected }) => {
    it(`ホストのとき ${expected} を返す`, () => {
      // Arrange
      setupAuthAs(HOST_USER_ID);
      const lobby = ref(makeLobby({ status }));

      // Act
      const { canCancel } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

      // Assert
      expect(canCancel.value).toBe(expected);
    });
  });

  it('ホスト以外は status が open でも false を返す', () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));

    // Act
    const { canCancel } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(canCancel.value).toBe(false);
  });

  it('lobby が null のとき false を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const lobby = ref<LobbyDetail | null>(null);

    // Act
    const { canCancel } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(canCancel.value).toBe(false);
  });
});

describe('canEdit', () => {
  describe.each([
    { status: LobbyStatus.draft, expected: true },
    { status: LobbyStatus.open, expected: true },
    { status: LobbyStatus.scheduling, expected: true },
    { status: LobbyStatus.cancelled, expected: false },
  ])('ステータス policy (status=$status)', ({ status, expected }) => {
    it(`ホストのとき ${expected} を返す`, () => {
      // Arrange
      setupAuthAs(HOST_USER_ID);
      const lobby = ref(makeLobby({ status }));

      // Act
      const { canEdit } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

      // Assert
      expect(canEdit.value).toBe(expected);
    });
  });

  it('ホスト以外は status が draft でも false を返す', () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));

    // Act
    const { canEdit } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(canEdit.value).toBe(false);
  });

  it('lobby が null のとき false を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const lobby = ref<LobbyDetail | null>(null);

    // Act
    const { canEdit } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(canEdit.value).toBe(false);
  });
});

describe('publishLobby', () => {
  it('updateLobbyStatus を status: open で呼び出す', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateLobbyStatus).mockResolvedValue(
      makeUpdatedLobby(LobbyStatus.open),
    );
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));
    const { publishLobby } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await publishLobby();

    // Assert
    expect(updateLobbyStatus).toHaveBeenCalledWith(LOBBY_ID, {
      status: 'open',
    });
  });

  it('成功後に onUpdated を返り値の Lobby で呼び出す', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const updatedLobby = makeUpdatedLobby(LobbyStatus.open);
    vi.mocked(updateLobbyStatus).mockResolvedValue(updatedLobby);
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));
    const onUpdated = vi.fn();
    const { publishLobby } = useLobbyStatus(LOBBY_ID, lobby, onUpdated);

    // Act
    await publishLobby();

    // Assert
    expect(onUpdated).toHaveBeenCalledWith(updatedLobby);
  });

  it('成功時に success トーストを表示する', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateLobbyStatus).mockResolvedValue(
      makeUpdatedLobby(LobbyStatus.open),
    );
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));
    const { publishLobby } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await publishLobby();

    // Assert
    expect(mockToastSuccess).toHaveBeenCalledWith('募集を公開しました');
  });

  it('成功後に loading が false に戻る', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateLobbyStatus).mockResolvedValue(
      makeUpdatedLobby(LobbyStatus.open),
    );
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));
    const { publishLobby, loading } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await publishLobby();

    // Assert
    expect(loading.value).toBe(false);
  });

  it('API エラー時に error トーストを表示する', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateLobbyStatus).mockRejectedValue(new Error('サーバーエラー'));
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));
    const { publishLobby } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await publishLobby();

    // Assert
    expect(mockToastError).toHaveBeenCalledWith('募集の公開に失敗しました');
  });

  it('ホスト以外は API を呼ばない', async () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));
    const { publishLobby } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await publishLobby();

    // Assert
    expect(updateLobbyStatus).not.toHaveBeenCalled();
  });

  it('status が open のときは API を呼ばない', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const { publishLobby } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await publishLobby();

    // Assert
    expect(updateLobbyStatus).not.toHaveBeenCalled();
  });

  it('loading 中の重複呼び出しは無視する', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    let resolve!: (v: Lobby) => void;
    vi.mocked(updateLobbyStatus).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));
    const { publishLobby } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    const first = publishLobby();
    await publishLobby();
    resolve(makeUpdatedLobby(LobbyStatus.open));
    await first;

    // Assert
    expect(updateLobbyStatus).toHaveBeenCalledTimes(1);
  });
});

describe('cancelLobby', () => {
  it('updateLobbyStatus を status: cancelled で呼び出す', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateLobbyStatus).mockResolvedValue(
      makeUpdatedLobby(LobbyStatus.cancelled),
    );
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const { cancelLobby } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await cancelLobby();

    // Assert
    expect(updateLobbyStatus).toHaveBeenCalledWith(LOBBY_ID, {
      status: 'cancelled',
    });
  });

  it('成功後に onUpdated を返り値の Lobby で呼び出す', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const updatedLobby = makeUpdatedLobby(LobbyStatus.cancelled);
    vi.mocked(updateLobbyStatus).mockResolvedValue(updatedLobby);
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const onUpdated = vi.fn();
    const { cancelLobby } = useLobbyStatus(LOBBY_ID, lobby, onUpdated);

    // Act
    await cancelLobby();

    // Assert
    expect(onUpdated).toHaveBeenCalledWith(updatedLobby);
  });

  it('成功時に success トーストを表示する', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateLobbyStatus).mockResolvedValue(
      makeUpdatedLobby(LobbyStatus.cancelled),
    );
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const { cancelLobby } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await cancelLobby();

    // Assert
    expect(mockToastSuccess).toHaveBeenCalledWith('募集を中止しました');
  });

  it('成功後に loading が false に戻る', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateLobbyStatus).mockResolvedValue(
      makeUpdatedLobby(LobbyStatus.cancelled),
    );
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const { cancelLobby, loading } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await cancelLobby();

    // Assert
    expect(loading.value).toBe(false);
  });

  it('API エラー時に error トーストを表示する', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateLobbyStatus).mockRejectedValue(new Error('サーバーエラー'));
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const { cancelLobby } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await cancelLobby();

    // Assert
    expect(mockToastError).toHaveBeenCalledWith('募集の中止に失敗しました');
  });

  it('ホスト以外は API を呼ばない', async () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const { cancelLobby } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await cancelLobby();

    // Assert
    expect(updateLobbyStatus).not.toHaveBeenCalled();
  });

  it('status が draft のときは API を呼ばない（UI では未公開の中止を提供しない）', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));
    const { cancelLobby } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await cancelLobby();

    // Assert
    expect(updateLobbyStatus).not.toHaveBeenCalled();
  });

  it('loading 中の重複呼び出しは無視する', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    let resolve!: (v: Lobby) => void;
    vi.mocked(updateLobbyStatus).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const { cancelLobby } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    const first = cancelLobby();
    await cancelLobby();
    resolve(makeUpdatedLobby(LobbyStatus.cancelled));
    await first;

    // Assert
    expect(updateLobbyStatus).toHaveBeenCalledTimes(1);
  });
});
