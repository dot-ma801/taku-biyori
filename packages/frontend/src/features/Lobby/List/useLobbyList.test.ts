import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyListItemModel } from '@/models/lobby';

vi.mock('@/api/lobby', () => ({
  listLobbies: vi.fn(),
}));

import { listLobbies } from '@/api/lobby';
import { useLobbyList } from '@/features/Lobby/List/useLobbyList';

const mockListLobbies = vi.mocked(listLobbies);

function makeLobby(
  overrides: Partial<LobbyListItemModel> = {},
): LobbyListItemModel {
  return {
    id: crypto.randomUUID(),
    title: 'テスト募集枠',
    scenarioName: null,
    status: LobbyStatus.draft,
    openUntil: null,
    memberCount: 1,
    maxPlayers: null,
    role: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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
        new Promise<LobbyListItemModel[]>((resolve) => {
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

  describe('filteredMyLobbies（自分のロビーを statuses で絞り込む）', () => {
    it('statuses を指定しない場合は myLobbies をそのまま返す', async () => {
      // Arrange
      const myLobby = makeLobby({ role: 'host', status: LobbyStatus.open });
      const publicLobby = makeLobby({ role: null, status: LobbyStatus.open });
      mockListLobbies.mockResolvedValue([myLobby, publicLobby]);

      // Act
      const { filteredMyLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(filteredMyLobbies.value).toEqual([myLobby]);
    });

    it('statuses を指定した場合は自分のロビーのうち該当ステータスのみ返す', async () => {
      // Arrange
      const myOpenLobby = makeLobby({ role: 'host', status: LobbyStatus.open });
      const myDraftLobby = makeLobby({
        role: 'host',
        status: LobbyStatus.draft,
      });
      const publicOpenLobby = makeLobby({
        role: null,
        status: LobbyStatus.open,
      });
      mockListLobbies.mockResolvedValue([
        myOpenLobby,
        myDraftLobby,
        publicOpenLobby,
      ]);

      // Act
      const { filteredMyLobbies, fetch } = useLobbyList([LobbyStatus.open]);
      await fetch();

      // Assert
      expect(filteredMyLobbies.value).toEqual([myOpenLobby]);
    });
  });

  describe('filteredPublicLobbies（公開ロビーを statuses で絞り込む）', () => {
    it('statuses を指定しない場合は publicLobbies をそのまま返す', async () => {
      // Arrange
      const myLobby = makeLobby({ role: 'host', status: LobbyStatus.open });
      const publicLobby = makeLobby({ role: null, status: LobbyStatus.open });
      mockListLobbies.mockResolvedValue([myLobby, publicLobby]);

      // Act
      const { filteredPublicLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(filteredPublicLobbies.value).toEqual([publicLobby]);
    });

    it('statuses を指定した場合は公開ロビーのうち該当ステータスのみ返す', async () => {
      // Arrange
      const publicOpenLobby = makeLobby({
        role: null,
        status: LobbyStatus.open,
      });
      const publicDraftLobby = makeLobby({
        role: null,
        status: LobbyStatus.draft,
      });
      const myOpenLobby = makeLobby({ role: 'host', status: LobbyStatus.open });
      mockListLobbies.mockResolvedValue([
        publicOpenLobby,
        publicDraftLobby,
        myOpenLobby,
      ]);

      // Act
      const { filteredPublicLobbies, fetch } = useLobbyList([LobbyStatus.open]);
      await fetch();

      // Assert
      expect(filteredPublicLobbies.value).toEqual([publicOpenLobby]);
    });
  });

  describe('hasFilteredLobbies（絞り込み後に表示する募集枠があるか）', () => {
    it('募集枠が1件も無い場合は false になる', async () => {
      // Arrange
      mockListLobbies.mockResolvedValue([]);

      // Act
      const { hasFilteredLobbies, fetch } = useLobbyList([LobbyStatus.draft]);
      await fetch();

      // Assert
      expect(hasFilteredLobbies.value).toBe(false);
    });

    it('該当ステータスの自分の募集枠がある場合は true になる', async () => {
      // Arrange
      mockListLobbies.mockResolvedValue([
        makeLobby({ role: 'host', status: LobbyStatus.draft }),
      ]);

      // Act
      const { hasFilteredLobbies, fetch } = useLobbyList([LobbyStatus.draft]);
      await fetch();

      // Assert
      expect(hasFilteredLobbies.value).toBe(true);
    });

    it('該当ステータスの公開募集枠がある場合は true になる', async () => {
      // Arrange
      mockListLobbies.mockResolvedValue([
        makeLobby({ role: null, status: LobbyStatus.open }),
      ]);

      // Act
      const { hasFilteredLobbies, fetch } = useLobbyList([LobbyStatus.open]);
      await fetch();

      // Assert
      expect(hasFilteredLobbies.value).toBe(true);
    });

    it('statuses に該当する募集枠が無い場合は false になる', async () => {
      // Arrange
      mockListLobbies.mockResolvedValue([
        makeLobby({ role: 'host', status: LobbyStatus.open }),
        makeLobby({ role: null, status: LobbyStatus.cancelled }),
      ]);

      // Act
      const { hasFilteredLobbies, fetch } = useLobbyList([LobbyStatus.draft]);
      await fetch();

      // Assert
      expect(hasFilteredLobbies.value).toBe(false);
    });

    it('statuses 未指定の場合は募集枠が1件でもあれば true になる', async () => {
      // Arrange
      mockListLobbies.mockResolvedValue([
        makeLobby({ role: null, status: LobbyStatus.cancelled }),
      ]);

      // Act
      const { hasFilteredLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(hasFilteredLobbies.value).toBe(true);
    });
  });
});
