import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGetLobbyDetail } from '@/features/Lobby/Detail/composables/useGetLobbyDetail';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyDetailModel, LobbyEntryModel } from '@/models/lobby';

vi.mock('@/api/lobby', () => ({
  getLobby: vi.fn(),
}));

// composable を component 外で呼ぶため onMounted は no-op にし、
// 初期ロードはテスト側で明示的に fetch() を呼んで再現する。
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>();
  return { ...actual, onMounted: vi.fn() };
});

import { getLobby } from '@/api/lobby';

const LOBBY_ID = 'lobby-1';

function makeEntry(id: string, leftAt: Date | null = null): LobbyEntryModel {
  return {
    id,
    userId: null,
    userName: null,
    guestName: 'ゲスト',
    joinedAt: new Date('2024-01-01T00:00:00Z'),
    leftAt,
  };
}

function makeLobby(
  overrides: Partial<LobbyDetailModel> & { entries?: LobbyEntryModel[] } = {},
): LobbyDetailModel {
  const entries = overrides.entries ?? [];
  return {
    id: LOBBY_ID,
    title: 'テストロビー',
    description: null,
    scenarioName: null,
    location: null,
    status: LobbyStatus.open,
    maxPlayers: null,
    publishedAt: new Date('2026-01-01T00:00:00Z'),
    openUntil: null,
    receptionClosedAt: null,
    disbandedAt: null,
    hostUserId: 'host-1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
    entries,
    activeEntries: entries.filter((entry) => entry.leftAt === null),
  };
}

// lobby を初期ロード済みの状態にした composable を返すヘルパー
async function setupLoaded(lobby: LobbyDetailModel) {
  vi.mocked(getLobby).mockResolvedValue(lobby);
  const detail = useGetLobbyDetail(LOBBY_ID);
  await detail.fetch();
  return detail;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fetch', () => {
  it('取得したロビーを lobby に格納する', async () => {
    // Arrange
    const lobby = makeLobby({ entries: [makeEntry('m1')] });

    // Act
    const { lobby: state } = await setupLoaded(lobby);

    // Assert
    expect(getLobby).toHaveBeenCalledWith(LOBBY_ID);
    expect(state.value).toEqual(lobby);
  });

  it('取得に失敗した場合は errorMessage を設定する', async () => {
    // Arrange
    vi.mocked(getLobby).mockRejectedValue(new Error('network error'));

    // Act
    const { fetch, errorMessage, loading } = useGetLobbyDetail(LOBBY_ID);
    await fetch();

    // Assert
    expect(errorMessage.value).toBe('エラーが発生しました');
    expect(loading.value).toBe(false);
  });
});

describe('patchLobby', () => {
  it('lobby の一部フィールドを差し替える', async () => {
    // Arrange
    const { lobby, patchLobby } = await setupLoaded(
      makeLobby({ title: '旧タイトル' }),
    );

    // Act
    patchLobby({ title: '新タイトル' });

    // Assert
    expect(lobby.value?.title).toBe('新タイトル');
  });

  it('lobby 未ロード時は何もしない', () => {
    // Arrange
    const { lobby, patchLobby } = useGetLobbyDetail(LOBBY_ID);

    // Act
    patchLobby({ title: '新タイトル' });

    // Assert
    expect(lobby.value).toBeNull();
  });
});

describe('addEntry', () => {
  it('entries の末尾に新しい参加を追加する', async () => {
    // Arrange
    const { lobby, addEntry } = await setupLoaded(
      makeLobby({ entries: [makeEntry('m1')] }),
    );
    const newMember = makeEntry('m2');

    // Act
    addEntry(newMember);

    // Assert
    expect(lobby.value?.entries.map((m) => m.id)).toEqual(['m1', 'm2']);
  });

  it('既存メンバーを書き換えず新しい配列を生成する（不変更新）', async () => {
    // Arrange
    const { lobby, addEntry } = await setupLoaded(
      makeLobby({ entries: [makeEntry('m1')] }),
    );
    const before = lobby.value!.entries;

    // Act
    addEntry(makeEntry('m2'));

    // Assert
    expect(lobby.value?.entries).not.toBe(before);
    expect(before.map((m) => m.id)).toEqual(['m1']);
  });

  it('lobby 未ロード時は何もしない', () => {
    // Arrange: fetch せずに呼ぶ
    const { lobby, addEntry } = useGetLobbyDetail(LOBBY_ID);

    // Act
    addEntry(makeEntry('m1'));

    // Assert
    expect(lobby.value).toBeNull();
  });
});

describe('removeEntry', () => {
  it('指定 id のメンバーを削除する', async () => {
    // Arrange
    const { lobby, removeEntry } = await setupLoaded(
      makeLobby({ entries: [makeEntry('m1'), makeEntry('m2')] }),
    );

    // Act
    removeEntry('m1');

    // Assert
    expect(lobby.value?.entries.map((m) => m.id)).toEqual(['m2']);
  });

  it('存在しない id のときはメンバーを変更しない', async () => {
    // Arrange
    const { lobby, removeEntry } = await setupLoaded(
      makeLobby({ entries: [makeEntry('m1')] }),
    );

    // Act
    removeEntry('not-exist');

    // Assert
    expect(lobby.value?.entries.map((m) => m.id)).toEqual(['m1']);
  });

  it('lobby 未ロード時は何もしない', () => {
    // Arrange
    const { lobby, removeEntry } = useGetLobbyDetail(LOBBY_ID);

    // Act
    removeEntry('m1');

    // Assert
    expect(lobby.value).toBeNull();
  });
});

describe('activeEntryCount', () => {
  it('在籍中の参加者の件数を返す', async () => {
    // Arrange
    const { activeEntryCount } = await setupLoaded(
      makeLobby({ entries: [makeEntry('m1'), makeEntry('m2')] }),
    );

    // Act & Assert
    expect(activeEntryCount.value).toBe(2);
  });

  it('脱退済みの参加者は数えない', async () => {
    // Arrange
    const { activeEntryCount } = await setupLoaded(
      makeLobby({
        entries: [
          makeEntry('m1'),
          makeEntry('m2', new Date('2026-08-10T00:00:00Z')),
        ],
      }),
    );

    // Act & Assert
    expect(activeEntryCount.value).toBe(1);
  });

  it('lobby 未ロード時は 0 を返す', () => {
    // Arrange
    const { activeEntryCount } = useGetLobbyDetail(LOBBY_ID);

    // Act & Assert
    expect(activeEntryCount.value).toBe(0);
  });
});
