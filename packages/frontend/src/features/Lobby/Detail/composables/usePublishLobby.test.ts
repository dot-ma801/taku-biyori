import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { usePublishLobby } from '@/features/Lobby/Detail/composables/usePublishLobby';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyDetail } from '@taku-biyori/shared';

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

function makeOpenedLobby() {
  return {
    id: LOBBY_ID,
    title: 'テストロビー',
    status: LobbyStatus.open,
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
    const { isHost } = usePublishLobby(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(isHost.value).toBe(true);
  });

  it('currentUser.id が hostUserId と異なるとき false を返す', () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);
    const lobby = ref(makeLobby());

    // Act
    const { isHost } = usePublishLobby(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(isHost.value).toBe(false);
  });

  it('lobby が null のとき false を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const lobby = ref<LobbyDetail | null>(null);

    // Act
    const { isHost } = usePublishLobby(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(isHost.value).toBe(false);
  });
});

describe('canPublish', () => {
  describe.each([
    { status: LobbyStatus.draft, expected: true },
    { status: LobbyStatus.open, expected: false },
    { status: LobbyStatus.scheduling, expected: false },
    { status: LobbyStatus.confirmed, expected: false },
    { status: LobbyStatus.cancelled, expected: false },
  ])('ステータス policy (status=$status)', ({ status, expected }) => {
    it(`ホストのとき ${expected} を返す`, () => {
      // Arrange
      setupAuthAs(HOST_USER_ID);
      const lobby = ref(makeLobby({ status }));

      // Act
      const { canPublish } = usePublishLobby(LOBBY_ID, lobby, vi.fn());

      // Assert
      expect(canPublish.value).toBe(expected);
    });
  });

  it('ホスト以外は status が draft でも false を返す', () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));

    // Act
    const { canPublish } = usePublishLobby(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(canPublish.value).toBe(false);
  });

  it('lobby が null のとき false を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const lobby = ref<LobbyDetail | null>(null);

    // Act
    const { canPublish } = usePublishLobby(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(canPublish.value).toBe(false);
  });
});

describe('publishLobby', () => {
  it('updateLobbyStatus を status: open で呼び出す', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateLobbyStatus).mockResolvedValue(makeOpenedLobby());
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));
    const { publishLobby } = usePublishLobby(LOBBY_ID, lobby, vi.fn());

    // Act
    await publishLobby();

    // Assert
    expect(updateLobbyStatus).toHaveBeenCalledWith(LOBBY_ID, {
      status: 'open',
    });
  });

  it('成功後に onPublished を返り値の Lobby で呼び出す', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const updatedLobby = makeOpenedLobby();
    vi.mocked(updateLobbyStatus).mockResolvedValue(updatedLobby);
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));
    const onPublished = vi.fn();
    const { publishLobby } = usePublishLobby(LOBBY_ID, lobby, onPublished);

    // Act
    await publishLobby();

    // Assert
    expect(onPublished).toHaveBeenCalledWith(updatedLobby);
  });

  it('成功時に success トーストを表示する', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateLobbyStatus).mockResolvedValue(makeOpenedLobby());
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));
    const { publishLobby } = usePublishLobby(LOBBY_ID, lobby, vi.fn());

    // Act
    await publishLobby();

    // Assert
    expect(mockToastSuccess).toHaveBeenCalledWith('募集を公開しました');
  });

  it('成功後に loading が false に戻る', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateLobbyStatus).mockResolvedValue(makeOpenedLobby());
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));
    const { publishLobby, loading } = usePublishLobby(LOBBY_ID, lobby, vi.fn());

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
    const { publishLobby } = usePublishLobby(LOBBY_ID, lobby, vi.fn());

    // Act
    await publishLobby();

    // Assert
    expect(mockToastError).toHaveBeenCalledWith('募集の公開に失敗しました');
  });

  it('ホスト以外は API を呼ばない', async () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));
    const { publishLobby } = usePublishLobby(LOBBY_ID, lobby, vi.fn());

    // Act
    await publishLobby();

    // Assert
    expect(updateLobbyStatus).not.toHaveBeenCalled();
  });

  it('status が open のときは API を呼ばない', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const { publishLobby } = usePublishLobby(LOBBY_ID, lobby, vi.fn());

    // Act
    await publishLobby();

    // Assert
    expect(updateLobbyStatus).not.toHaveBeenCalled();
  });

  it('loading 中の重複呼び出しは無視する', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    let resolve!: (v: ReturnType<typeof makeOpenedLobby>) => void;
    vi.mocked(updateLobbyStatus).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));
    const { publishLobby } = usePublishLobby(LOBBY_ID, lobby, vi.fn());

    // Act
    const first = publishLobby();
    await publishLobby();
    resolve(makeOpenedLobby());
    await first;

    // Assert
    expect(updateLobbyStatus).toHaveBeenCalledTimes(1);
  });
});
