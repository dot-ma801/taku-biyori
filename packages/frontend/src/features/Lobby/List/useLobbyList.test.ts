import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyListItemModel } from '@/models/lobby';

vi.mock('@/api/lobby', () => ({
  listLobbies: vi.fn(),
}));

// useSession（nanostores の Atom）のモック。ログイン中のユーザーを固定する
type SessionValue = { data: { user?: { id?: string | null } } | null };
const currentSessionValue: SessionValue = { data: { user: { id: 'my-user' } } };

vi.mock('@/lib/auth', () => ({
  useSession: {
    get: vi.fn(() => currentSessionValue),
    subscribe: vi.fn(() => () => {}),
  },
}));

import { listLobbies } from '@/api/lobby';
import { useLobbyList } from '@/features/Lobby/List/useLobbyList';

const mockListLobbies = vi.mocked(listLobbies);

const MY_USER_ID = 'my-user';
const OTHER_USER_ID = 'other-user';

/** 自分がホストのロビー（v0.2 の ...hostedByMe() に相当） */
const hostedByMe = (): Partial<LobbyListItemModel> => ({
  hostUserId: MY_USER_ID,
});

/** 自分が参加しているロビー（v0.2 の ...joinedByMe() に相当） */
const joinedByMe = (): Partial<LobbyListItemModel> => ({
  hostUserId: OTHER_USER_ID,
  entries: [
    {
      id: 'entry-1',
      userId: MY_USER_ID,
      userName: 'わたし',
      guestName: null,
      joinedAt: new Date('2026-01-01T00:00:00Z'),
      leftAt: null,
    },
  ],
  activeEntries: [
    {
      id: 'entry-1',
      userId: MY_USER_ID,
      userName: 'わたし',
      guestName: null,
      joinedAt: new Date('2026-01-01T00:00:00Z'),
      leftAt: null,
    },
  ],
});

function makeLobby(
  overrides: Partial<LobbyListItemModel> = {},
): LobbyListItemModel {
  return {
    id: crypto.randomUUID(),
    title: 'テスト募集枠',
    scenarioName: null,
    status: LobbyStatus.draft,
    publishedAt: null,
    openUntil: null,
    receptionClosedAt: null,
    maxPlayers: null,
    entries: [],
    activeEntries: [],
    hostUserId: OTHER_USER_ID,
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
      const publicLobby = makeLobby();
      const myLobby = makeLobby({ ...hostedByMe() });
      mockListLobbies.mockResolvedValue([publicLobby, myLobby]);

      // Act
      const { publicLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(publicLobbies.value).toEqual([publicLobby]);
    });

    it('該当募集枠がない場合は空配列になる', async () => {
      // Arrange
      mockListLobbies.mockResolvedValue([makeLobby({ ...hostedByMe() })]);

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
      const myLobby = makeLobby({ ...hostedByMe() });
      mockListLobbies.mockResolvedValue([myLobby]);

      // Act
      const { myLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(myLobbies.value).toContainEqual(myLobby);
    });

    it('role=member の募集枠を含む', async () => {
      // Arrange
      const myLobby = makeLobby({ ...joinedByMe() });
      mockListLobbies.mockResolvedValue([myLobby]);

      // Act
      const { myLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(myLobbies.value).toContainEqual(myLobby);
    });

    it('role=null の募集枠は含まない', async () => {
      // Arrange
      const publicLobby = makeLobby();
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
      const myLobby = makeLobby({ ...hostedByMe(), status: LobbyStatus.open });
      const publicLobby = makeLobby({ status: LobbyStatus.open });
      mockListLobbies.mockResolvedValue([myLobby, publicLobby]);

      // Act
      const { filteredMyLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(filteredMyLobbies.value).toEqual([myLobby]);
    });

    it('statuses を指定した場合は自分のロビーのうち該当ステータスのみ返す', async () => {
      // Arrange
      const myOpenLobby = makeLobby({
        ...hostedByMe(),
        status: LobbyStatus.open,
      });
      const myDraftLobby = makeLobby({
        ...hostedByMe(),
        status: LobbyStatus.draft,
      });
      const publicOpenLobby = makeLobby({
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
      const myLobby = makeLobby({ ...hostedByMe(), status: LobbyStatus.open });
      const publicLobby = makeLobby({ status: LobbyStatus.open });
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
        status: LobbyStatus.open,
      });
      const publicDraftLobby = makeLobby({
        status: LobbyStatus.draft,
      });
      const myOpenLobby = makeLobby({
        ...hostedByMe(),
        status: LobbyStatus.open,
      });
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
        makeLobby({ ...hostedByMe(), status: LobbyStatus.draft }),
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
        makeLobby({ status: LobbyStatus.open }),
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
        makeLobby({ ...hostedByMe(), status: LobbyStatus.open }),
        makeLobby({ status: LobbyStatus.disbanded }),
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
        makeLobby({ status: LobbyStatus.disbanded }),
      ]);

      // Act
      const { hasFilteredLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(hasFilteredLobbies.value).toBe(true);
    });
  });
});
