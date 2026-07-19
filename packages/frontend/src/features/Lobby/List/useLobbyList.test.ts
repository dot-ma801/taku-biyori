import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyListItem } from '@taku-biyori/shared';

vi.mock('@/api/lobby', () => ({
  listLobbies: vi.fn(),
}));

import { listLobbies } from '@/api/lobby';
import { useLobbyList } from '@/features/Lobby/List/useLobbyList';

const mockListLobbies = vi.mocked(listLobbies);

function makeLobby(overrides: Partial<LobbyListItem> = {}): LobbyListItem {
  return {
    id: crypto.randomUUID(),
    title: 'テスト募集枠',
    scenarioName: null,
    status: LobbyStatus.draft,
    isPublished: false,
    openUntil: null,
    memberCount: 1,
    maxPlayers: null,
    role: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useLobbyList', () => {
  describe('データ取得', () => {
    it('マウント時に listLobbies を呼び出す', async () => {
      // Arrange
      mockListLobbies.mockResolvedValue([]);

      // Act
      const { fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(mockListLobbies).toHaveBeenCalledOnce();
    });

    it('取得成功時は allLobbies に結果が格納される', async () => {
      // Arrange
      const lobbies = [makeLobby(), makeLobby()];
      mockListLobbies.mockResolvedValue(lobbies);

      // Act
      const { allLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(allLobbies.value).toEqual(lobbies);
    });

    it('取得中は loading が true になる', async () => {
      // Arrange
      let resolveFetch!: () => void;
      mockListLobbies.mockReturnValue(
        new Promise<LobbyListItem[]>((resolve) => {
          resolveFetch = () => resolve([]);
        }),
      );

      // Act
      const { loading, fetch } = useLobbyList();
      const fetchPromise = fetch();

      // Assert（ローディング中）
      expect(loading.value).toBe(true);

      resolveFetch();
      await fetchPromise;

      // Assert（ローディング後）
      expect(loading.value).toBe(false);
    });

    it('取得失敗時は errorMessage がセットされる', async () => {
      // Arrange
      mockListLobbies.mockRejectedValue(new Error('Network error'));

      // Act
      const { errorMessage, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(errorMessage.value).toBe('ロビー一覧の取得に失敗しました');
    });

    it('取得失敗時は loading が false に戻る', async () => {
      // Arrange
      mockListLobbies.mockRejectedValue(new Error('Network error'));

      // Act
      const { loading, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(loading.value).toBe(false);
    });
  });

  describe('publicLobbies（自分が関わっていない募集枠）', () => {
    it('role=null の募集枠のみ含む', async () => {
      // Arrange
      const publicLobby = makeLobby({ role: null });
      const myLobby = makeLobby({ role: 'host' });
      mockListLobbies.mockResolvedValue([publicLobby, myLobby]);

      // Act
      const { publicLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(publicLobbies.value).toEqual([publicLobby]);
    });

    it('該当募集枠がない場合は空配列になる', async () => {
      // Arrange
      mockListLobbies.mockResolvedValue([makeLobby({ role: 'host' })]);

      // Act
      const { publicLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(publicLobbies.value).toHaveLength(0);
    });
  });

  describe('myLobbies（自分が関わる募集枠）', () => {
    it('role=host の募集枠を含む', async () => {
      // Arrange
      const myLobby = makeLobby({ role: 'host' });
      mockListLobbies.mockResolvedValue([myLobby]);

      // Act
      const { myLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(myLobbies.value).toContainEqual(myLobby);
    });

    it('role=member の募集枠を含む', async () => {
      // Arrange
      const myLobby = makeLobby({ role: 'member' });
      mockListLobbies.mockResolvedValue([myLobby]);

      // Act
      const { myLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(myLobbies.value).toContainEqual(myLobby);
    });

    it('role=null の募集枠は含まない', async () => {
      // Arrange
      const publicLobby = makeLobby({ role: null });
      mockListLobbies.mockResolvedValue([publicLobby]);

      // Act
      const { myLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(myLobbies.value).not.toContainEqual(publicLobby);
    });
  });

  describe('filteredLobbies（statuses フィルタ）', () => {
    it('statuses を指定しない場合は allLobbies をそのまま返す', async () => {
      // Arrange
      const lobbies = [
        makeLobby({ status: LobbyStatus.draft }),
        makeLobby({ status: LobbyStatus.open }),
        makeLobby({ status: LobbyStatus.confirmed }),
      ];
      mockListLobbies.mockResolvedValue(lobbies);

      // Act
      const { filteredLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(filteredLobbies.value).toEqual(lobbies);
    });

    it('statuses を指定した場合は該当するステータスのみ返す', async () => {
      // Arrange
      const openLobby = makeLobby({ status: LobbyStatus.open });
      const schedulingLobby = makeLobby({ status: LobbyStatus.scheduling });
      const confirmedLobby = makeLobby({ status: LobbyStatus.confirmed });
      mockListLobbies.mockResolvedValue([
        openLobby,
        schedulingLobby,
        confirmedLobby,
      ]);

      // Act
      const { filteredLobbies, fetch } = useLobbyList([
        LobbyStatus.open,
        LobbyStatus.scheduling,
      ]);
      await fetch();

      // Assert
      expect(filteredLobbies.value).toEqual([openLobby, schedulingLobby]);
    });

    it('statuses が空配列の場合は何も返さない', async () => {
      // Arrange
      mockListLobbies.mockResolvedValue([
        makeLobby({ status: LobbyStatus.open }),
      ]);

      // Act
      const { filteredLobbies, fetch } = useLobbyList([]);
      await fetch();

      // Assert
      expect(filteredLobbies.value).toHaveLength(0);
    });
  });
});
