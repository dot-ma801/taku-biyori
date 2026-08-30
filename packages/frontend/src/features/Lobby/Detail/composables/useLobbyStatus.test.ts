import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useLobbyStatus } from '@/features/Lobby/Detail/composables/useLobbyStatus';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyDetailModel, LobbyModel } from '@/models/lobby';

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

function makeLobby(
  overrides: Partial<LobbyDetailModel> = {},
): LobbyDetailModel {
  return {
    ...makeUpdatedLobby(LobbyStatus.draft),
    entries: [],
    activeEntries: [],
    ...overrides,
  };
}

function makeUpdatedLobby(status: LobbyStatus): LobbyModel {
  return {
    id: LOBBY_ID,
    title: 'テストロビー',
    description: null,
    scenarioName: null,
    location: null,
    status,
    maxPlayers: null,
    publishedAt: null,
    openUntil: null,
    receptionClosedAt: null,
    disbandedAt: null,
    hostUserId: HOST_USER_ID,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
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
    const lobby = ref<LobbyDetailModel | null>(null);

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
    { status: LobbyStatus.closed, expected: false },
    { status: LobbyStatus.disbanded, expected: false },
    { status: LobbyStatus.closed, expected: false },
    { status: LobbyStatus.disbanded, expected: false },
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
    const lobby = ref<LobbyDetailModel | null>(null);

    // Act
    const { canPublish } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(canPublish.value).toBe(false);
  });
});

describe('canDisband', () => {
  // UI 仕様: 未公開（draft）の募集枠に「募集中止」ボタンは出さない。
  // API 上は draft からの中止も許可される（shared の LOBBY_ACTION_POLICIES 参照）
  describe.each([
    { status: LobbyStatus.draft, expected: false },
    { status: LobbyStatus.open, expected: true },
    { status: LobbyStatus.closed, expected: true },
    { status: LobbyStatus.disbanded, expected: false },
  ])('ステータス policy (status=$status)', ({ status, expected }) => {
    it(`ホストのとき ${expected} を返す`, () => {
      // Arrange
      setupAuthAs(HOST_USER_ID);
      const lobby = ref(makeLobby({ status }));

      // Act
      const { canDisband } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

      // Assert
      expect(canDisband.value).toBe(expected);
    });
  });

  it('ホスト以外は status が open でも false を返す', () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));

    // Act
    const { canDisband } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(canDisband.value).toBe(false);
  });

  it('lobby が null のとき false を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const lobby = ref<LobbyDetailModel | null>(null);

    // Act
    const { canDisband } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(canDisband.value).toBe(false);
  });
});

describe('canEdit', () => {
  describe.each([
    { status: LobbyStatus.draft, expected: true },
    { status: LobbyStatus.open, expected: true },
    { status: LobbyStatus.closed, expected: true },
    { status: LobbyStatus.disbanded, expected: false },
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
    const lobby = ref<LobbyDetailModel | null>(null);

    // Act
    const { canEdit } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(canEdit.value).toBe(false);
  });
});

describe('canCloseReception / canReopenReception', () => {
  describe.each([
    { status: LobbyStatus.draft, close: false, reopen: false },
    { status: LobbyStatus.open, close: true, reopen: false },
    { status: LobbyStatus.closed, close: false, reopen: true },
    { status: LobbyStatus.disbanded, close: false, reopen: false },
  ])('ステータス policy (status=$status)', ({ status, close, reopen }) => {
    it(`ホストのとき close=${close} / reopen=${reopen} を返す`, () => {
      // Arrange
      setupAuthAs(HOST_USER_ID);
      const lobby = ref(makeLobby({ status }));

      // Act
      const { canCloseReception, canReopenReception } = useLobbyStatus(
        LOBBY_ID,
        lobby,
        vi.fn(),
      );

      // Assert
      expect(canCloseReception.value).toBe(close);
      expect(canReopenReception.value).toBe(reopen);
    });
  });

  it('ホスト以外は open でも false を返す', () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));

    // Act
    const { canCloseReception } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Assert
    expect(canCloseReception.value).toBe(false);
  });
});

describe('closeReception', () => {
  it('updateLobbyStatus を status: closed で呼び出す', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateLobbyStatus).mockResolvedValue(
      makeUpdatedLobby(LobbyStatus.closed),
    );
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const { closeReception } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await closeReception();

    // Assert
    expect(updateLobbyStatus).toHaveBeenCalledWith(LOBBY_ID, {
      status: 'closed',
    });
  });

  it('遷移できないステータスでは API を呼ばない', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));
    const { closeReception } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await closeReception();

    // Assert
    expect(updateLobbyStatus).not.toHaveBeenCalled();
  });

  it('成功時に更新後のロビーを onUpdated へ渡す', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const updated = makeUpdatedLobby(LobbyStatus.closed);
    vi.mocked(updateLobbyStatus).mockResolvedValue(updated);
    const onUpdated = vi.fn();
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const { closeReception } = useLobbyStatus(LOBBY_ID, lobby, onUpdated);

    // Act
    await closeReception();

    // Assert
    expect(onUpdated).toHaveBeenCalledWith(updated);
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it('API エラー時に error トーストを表示する', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateLobbyStatus).mockRejectedValue(new Error('failed'));
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const { closeReception } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await closeReception();

    // Assert
    expect(mockToastError).toHaveBeenCalled();
  });
});

describe('reopenReception', () => {
  it('updateLobbyStatus を status: open で呼び出す（追加募集）', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateLobbyStatus).mockResolvedValue(
      makeUpdatedLobby(LobbyStatus.open),
    );
    const lobby = ref(makeLobby({ status: LobbyStatus.closed }));
    const { reopenReception } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await reopenReception();

    // Assert
    expect(updateLobbyStatus).toHaveBeenCalledWith(LOBBY_ID, {
      status: 'open',
    });
  });

  it('遷移できないステータスでは API を呼ばない', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const { reopenReception } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await reopenReception();

    // Assert
    expect(updateLobbyStatus).not.toHaveBeenCalled();
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
    let resolve!: (v: LobbyModel) => void;
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

describe('disbandLobby', () => {
  it('updateLobbyStatus を status: disbanded で呼び出す', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateLobbyStatus).mockResolvedValue(
      makeUpdatedLobby(LobbyStatus.disbanded),
    );
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const { disbandLobby } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await disbandLobby();

    // Assert
    expect(updateLobbyStatus).toHaveBeenCalledWith(LOBBY_ID, {
      status: 'disbanded',
    });
  });

  it('成功後に onUpdated を返り値の Lobby で呼び出す', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const updatedLobby = makeUpdatedLobby(LobbyStatus.disbanded);
    vi.mocked(updateLobbyStatus).mockResolvedValue(updatedLobby);
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const onUpdated = vi.fn();
    const { disbandLobby } = useLobbyStatus(LOBBY_ID, lobby, onUpdated);

    // Act
    await disbandLobby();

    // Assert
    expect(onUpdated).toHaveBeenCalledWith(updatedLobby);
  });

  it('成功時に success トーストを表示する', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateLobbyStatus).mockResolvedValue(
      makeUpdatedLobby(LobbyStatus.disbanded),
    );
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const { disbandLobby } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await disbandLobby();

    // Assert
    expect(mockToastSuccess).toHaveBeenCalledWith('企画を解散しました');
  });

  it('成功後に loading が false に戻る', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateLobbyStatus).mockResolvedValue(
      makeUpdatedLobby(LobbyStatus.disbanded),
    );
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const { disbandLobby, loading } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await disbandLobby();

    // Assert
    expect(loading.value).toBe(false);
  });

  it('API エラー時に error トーストを表示する', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateLobbyStatus).mockRejectedValue(new Error('サーバーエラー'));
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const { disbandLobby } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await disbandLobby();

    // Assert
    expect(mockToastError).toHaveBeenCalledWith('解散に失敗しました');
  });

  it('ホスト以外は API を呼ばない', async () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const { disbandLobby } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await disbandLobby();

    // Assert
    expect(updateLobbyStatus).not.toHaveBeenCalled();
  });

  it('status が draft のときは API を呼ばない（UI では未公開の中止を提供しない）', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const lobby = ref(makeLobby({ status: LobbyStatus.draft }));
    const { disbandLobby } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    await disbandLobby();

    // Assert
    expect(updateLobbyStatus).not.toHaveBeenCalled();
  });

  it('loading 中の重複呼び出しは無視する', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    let resolve!: (v: LobbyModel) => void;
    vi.mocked(updateLobbyStatus).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const lobby = ref(makeLobby({ status: LobbyStatus.open }));
    const { disbandLobby } = useLobbyStatus(LOBBY_ID, lobby, vi.fn());

    // Act
    const first = disbandLobby();
    await disbandLobby();
    resolve(makeUpdatedLobby(LobbyStatus.disbanded));
    await first;

    // Assert
    expect(updateLobbyStatus).toHaveBeenCalledTimes(1);
  });
});
