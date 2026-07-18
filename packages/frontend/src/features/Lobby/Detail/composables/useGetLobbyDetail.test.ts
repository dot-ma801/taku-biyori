import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGetLobbyDetail } from '@/features/Lobby/Detail/composables/useGetLobbyDetail';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyDetail, LobbyMember } from '@taku-biyori/shared';

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

function makeMember(id: string): LobbyMember {
  return {
    id,
    userId: null,
    userName: null,
    guestName: 'ゲスト',
    joinedAt: '2024-01-01T00:00:00Z',
  };
}

function makeLobby(overrides: Partial<LobbyDetail> = {}): LobbyDetail {
  return {
    id: LOBBY_ID,
    title: 'テストロビー',
    description: null,
    scenarioName: null,
    location: null,
    status: LobbyStatus.open,
    isPublished: true,
    maxPlayers: null,
    openUntil: null,
    closedAt: null,
    cancelledAt: null,
    hostUserId: 'host-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    members: [],
    ...overrides,
  };
}

// lobby を初期ロード済みの状態にした composable を返すヘルパー
async function setupLoaded(lobby: LobbyDetail) {
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
    const lobby = makeLobby({ members: [makeMember('m1')] });

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

describe('addMember', () => {
  it('members の末尾に新メンバーを追加する', async () => {
    // Arrange
    const { lobby, addMember } = await setupLoaded(
      makeLobby({ members: [makeMember('m1')] }),
    );
    const newMember = makeMember('m2');

    // Act
    addMember(newMember);

    // Assert
    expect(lobby.value?.members.map((m) => m.id)).toEqual(['m1', 'm2']);
  });

  it('既存メンバーを書き換えず新しい配列を生成する（不変更新）', async () => {
    // Arrange
    const { lobby, addMember } = await setupLoaded(
      makeLobby({ members: [makeMember('m1')] }),
    );
    const before = lobby.value!.members;

    // Act
    addMember(makeMember('m2'));

    // Assert
    expect(lobby.value?.members).not.toBe(before);
    expect(before.map((m) => m.id)).toEqual(['m1']);
  });

  it('lobby 未ロード時は何もしない', () => {
    // Arrange: fetch せずに呼ぶ
    const { lobby, addMember } = useGetLobbyDetail(LOBBY_ID);

    // Act
    addMember(makeMember('m1'));

    // Assert
    expect(lobby.value).toBeNull();
  });
});

describe('removeMember', () => {
  it('指定 id のメンバーを削除する', async () => {
    // Arrange
    const { lobby, removeMember } = await setupLoaded(
      makeLobby({ members: [makeMember('m1'), makeMember('m2')] }),
    );

    // Act
    removeMember('m1');

    // Assert
    expect(lobby.value?.members.map((m) => m.id)).toEqual(['m2']);
  });

  it('存在しない id のときはメンバーを変更しない', async () => {
    // Arrange
    const { lobby, removeMember } = await setupLoaded(
      makeLobby({ members: [makeMember('m1')] }),
    );

    // Act
    removeMember('not-exist');

    // Assert
    expect(lobby.value?.members.map((m) => m.id)).toEqual(['m1']);
  });

  it('lobby 未ロード時は何もしない', () => {
    // Arrange
    const { lobby, removeMember } = useGetLobbyDetail(LOBBY_ID);

    // Act
    removeMember('m1');

    // Assert
    expect(lobby.value).toBeNull();
  });
});

describe('memberCount', () => {
  it('members の件数を返す', async () => {
    // Arrange
    const { memberCount } = await setupLoaded(
      makeLobby({ members: [makeMember('m1'), makeMember('m2')] }),
    );

    // Act & Assert
    expect(memberCount.value).toBe(2);
  });

  it('lobby 未ロード時は 0 を返す', () => {
    // Arrange
    const { memberCount } = useGetLobbyDetail(LOBBY_ID);

    // Act & Assert
    expect(memberCount.value).toBe(0);
  });
});
