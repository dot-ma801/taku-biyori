import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyListItemModel } from '@/models/lobby';

vi.mock('@/api/lobby', () => ({
  listMyLobbies: vi.fn(),
  listPublicLobbies: vi.fn(),
}));

// useSession（nanostores の Atom）のモック。
// 既定はログイン中。セッション復元が遅れるケースは subscribe に流して再現する
type SessionValue = { data: { user?: { id?: string | null } } | null };
let currentSessionValue: SessionValue = { data: { user: { id: 'my-user' } } };
let sessionListener: ((value: SessionValue) => void) | null = null;

vi.mock('@/lib/auth', () => ({
  useSession: {
    get: vi.fn(() => currentSessionValue),
    subscribe: vi.fn((listener: (value: SessionValue) => void) => {
      sessionListener = listener;
      return () => {
        sessionListener = null;
      };
    }),
  },
}));

import { listMyLobbies, listPublicLobbies } from '@/api/lobby';
import { ApiError } from '@/lib/api-client';
import { useLobbyList } from '@/features/Lobby/List/useLobbyList';

const mockListMyLobbies = vi.mocked(listMyLobbies);
const mockListPublicLobbies = vi.mocked(listPublicLobbies);

const MY_USER_ID = 'my-user';
const OTHER_USER_ID = 'other-user';

/** 自分がホストのロビー */
const hostedByMe = (): Partial<LobbyListItemModel> => ({
  hostUserId: MY_USER_ID,
});

/** 自分が参加しているロビー */
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
    title: 'テストロビー',
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
  currentSessionValue = { data: { user: { id: MY_USER_ID } } };
  sessionListener = null;
  mockListMyLobbies.mockResolvedValue([]);
  mockListPublicLobbies.mockResolvedValue([]);
});

describe('useLobbyList', () => {
  describe('データ取得', () => {
    it('マウント時に自分の一覧と公開の一覧を両方呼び出す', async () => {
      // Arrange
      // beforeEach で両方とも空を返すようにしてある

      // Act
      const { fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(mockListMyLobbies).toHaveBeenCalledOnce();
      expect(mockListPublicLobbies).toHaveBeenCalledOnce();
    });

    it('取得成功時は myLobbies / publicLobbies にそれぞれ格納される', async () => {
      // Arrange
      const mine = makeLobby({ ...hostedByMe() });
      const publicLobby = makeLobby({ status: LobbyStatus.open });
      mockListMyLobbies.mockResolvedValue([mine]);
      mockListPublicLobbies.mockResolvedValue([publicLobby]);

      // Act
      const { myLobbies, publicLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(myLobbies.value).toEqual([mine]);
      expect(publicLobbies.value).toEqual([publicLobby]);
    });

    it('取得中は loading が true になる', async () => {
      // Arrange
      let resolveFetch!: () => void;
      mockListPublicLobbies.mockReturnValue(
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
      mockListPublicLobbies.mockRejectedValue(new Error('Network error'));

      // Act
      const { errorMessage, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(errorMessage.value).toBe('ロビー一覧の取得に失敗しました');
    });

    it('取得失敗時は loading が false に戻る', async () => {
      // Arrange
      mockListPublicLobbies.mockRejectedValue(new Error('Network error'));

      // Act
      const { loading, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(loading.value).toBe(false);
    });

    it('skipMine のときは自分の一覧を取りに行かない', async () => {
      // Arrange
      const publicLobby = makeLobby({ status: LobbyStatus.open });
      mockListPublicLobbies.mockResolvedValue([publicLobby]);

      // Act
      const { myLobbies, publicLobbies, fetch } = useLobbyList(undefined, {
        skipMine: true,
      });
      await fetch();

      // Assert
      expect(mockListMyLobbies).not.toHaveBeenCalled();
      expect(myLobbies.value).toEqual([]);
      expect(publicLobbies.value).toEqual([publicLobby]);
    });

    it('skipPublic のときは公開の一覧を取りに行かない', async () => {
      // Arrange
      const myLobby = makeLobby({ ...hostedByMe(), status: LobbyStatus.open });
      mockListMyLobbies.mockResolvedValue([myLobby]);

      // Act
      const { myLobbies, publicLobbies, fetch } = useLobbyList(undefined, {
        skipPublic: true,
      });
      await fetch();

      // Assert
      expect(mockListPublicLobbies).not.toHaveBeenCalled();
      expect(publicLobbies.value).toEqual([]);
      expect(myLobbies.value).toEqual([myLobby]);
    });

    it('未ログインで自分の一覧が 401 でも公開の一覧は表示する', async () => {
      // Arrange
      const publicLobby = makeLobby({ status: LobbyStatus.open });
      mockListMyLobbies.mockRejectedValue(new ApiError(401, 'Unauthorized'));
      mockListPublicLobbies.mockResolvedValue([publicLobby]);

      // Act
      const { myLobbies, publicLobbies, errorMessage, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(myLobbies.value).toEqual([]);
      expect(publicLobbies.value).toEqual([publicLobby]);
      expect(errorMessage.value).toBe('');
    });

    it('自分の一覧が 401 以外で失敗した場合はエラーにする', async () => {
      // Arrange
      mockListMyLobbies.mockRejectedValue(new ApiError(500, 'Server Error'));

      // Act
      const { errorMessage, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(errorMessage.value).toBe('ロビー一覧の取得に失敗しました');
    });
  });

  describe('publicLobbies（自分が関わっていないロビー）', () => {
    it('自分がホストのロビーは公開一覧から取り除く', async () => {
      // Arrange
      const publicLobby = makeLobby({ status: LobbyStatus.open });
      const myLobby = makeLobby({ ...hostedByMe(), status: LobbyStatus.open });
      mockListPublicLobbies.mockResolvedValue([publicLobby, myLobby]);

      // Act
      const { publicLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(publicLobbies.value).toEqual([publicLobby]);
    });

    it('セッション復元が取得より後でも、届いた時点で自分の分を取り除く', async () => {
      // Arrange
      // ダッシュボードはセッション復元を待たずに描画されるため、fetch 時点では
      // まだユーザー ID が無いことがある（router の requiresAuth なしルート）
      currentSessionValue = { data: null };
      const publicLobby = makeLobby({ status: LobbyStatus.open });
      const myLobby = makeLobby({ ...hostedByMe(), status: LobbyStatus.open });
      mockListPublicLobbies.mockResolvedValue([publicLobby, myLobby]);

      // Act
      const { publicLobbies, fetch } = useLobbyList();
      await fetch();
      const beforeRestore = publicLobbies.value;
      sessionListener?.({ data: { user: { id: MY_USER_ID } } });
      await nextTick();

      // Assert
      expect(beforeRestore).toHaveLength(2);
      expect(publicLobbies.value).toEqual([publicLobby]);
    });

    it('自分が参加しているロビーは公開一覧から取り除く', async () => {
      // Arrange
      const joined = makeLobby({ ...joinedByMe(), status: LobbyStatus.open });
      mockListPublicLobbies.mockResolvedValue([joined]);

      // Act
      const { publicLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(publicLobbies.value).toHaveLength(0);
    });
  });

  describe('filteredMyLobbies（自分のロビーを statuses で絞り込む）', () => {
    it('statuses を指定しない場合は myLobbies をそのまま返す', async () => {
      // Arrange
      const myLobby = makeLobby({ ...hostedByMe(), status: LobbyStatus.open });
      mockListMyLobbies.mockResolvedValue([myLobby]);

      // Act
      const { filteredMyLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(filteredMyLobbies.value).toEqual([myLobby]);
    });

    it('statuses を指定した場合は該当ステータスのみ返す', async () => {
      // Arrange
      const myOpenLobby = makeLobby({
        ...hostedByMe(),
        status: LobbyStatus.open,
      });
      const myDraftLobby = makeLobby({
        ...hostedByMe(),
        status: LobbyStatus.draft,
      });
      mockListMyLobbies.mockResolvedValue([myOpenLobby, myDraftLobby]);

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
      const publicLobby = makeLobby({ status: LobbyStatus.open });
      mockListPublicLobbies.mockResolvedValue([publicLobby]);

      // Act
      const { filteredPublicLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(filteredPublicLobbies.value).toEqual([publicLobby]);
    });

    it('statuses を指定した場合は該当ステータスのみ返す', async () => {
      // Arrange
      const publicOpenLobby = makeLobby({ status: LobbyStatus.open });
      const publicClosedLobby = makeLobby({ status: LobbyStatus.closed });
      mockListPublicLobbies.mockResolvedValue([
        publicOpenLobby,
        publicClosedLobby,
      ]);

      // Act
      const { filteredPublicLobbies, fetch } = useLobbyList([LobbyStatus.open]);
      await fetch();

      // Assert
      expect(filteredPublicLobbies.value).toEqual([publicOpenLobby]);
    });
  });

  describe('hasFilteredLobbies（絞り込み後に表示するロビーがあるか）', () => {
    it('ロビーが1件も無い場合は false になる', async () => {
      // Arrange
      // beforeEach で両方とも空を返すようにしてある

      // Act
      const { hasFilteredLobbies, fetch } = useLobbyList([LobbyStatus.draft]);
      await fetch();

      // Assert
      expect(hasFilteredLobbies.value).toBe(false);
    });

    it('該当ステータスの自分のロビーがある場合は true になる', async () => {
      // Arrange
      mockListMyLobbies.mockResolvedValue([
        makeLobby({ ...hostedByMe(), status: LobbyStatus.draft }),
      ]);

      // Act
      const { hasFilteredLobbies, fetch } = useLobbyList([LobbyStatus.draft]);
      await fetch();

      // Assert
      expect(hasFilteredLobbies.value).toBe(true);
    });

    it('該当ステータスの公開ロビーがある場合は true になる', async () => {
      // Arrange
      mockListPublicLobbies.mockResolvedValue([
        makeLobby({ status: LobbyStatus.open }),
      ]);

      // Act
      const { hasFilteredLobbies, fetch } = useLobbyList([LobbyStatus.open]);
      await fetch();

      // Assert
      expect(hasFilteredLobbies.value).toBe(true);
    });

    it('statuses に該当するロビーが無い場合は false になる', async () => {
      // Arrange
      mockListMyLobbies.mockResolvedValue([
        makeLobby({ ...hostedByMe(), status: LobbyStatus.open }),
      ]);
      mockListPublicLobbies.mockResolvedValue([
        makeLobby({ status: LobbyStatus.open }),
      ]);

      // Act
      const { hasFilteredLobbies, fetch } = useLobbyList([LobbyStatus.draft]);
      await fetch();

      // Assert
      expect(hasFilteredLobbies.value).toBe(false);
    });

    it('statuses 未指定の場合はロビーが1件でもあれば true になる', async () => {
      // Arrange
      mockListPublicLobbies.mockResolvedValue([
        makeLobby({ status: LobbyStatus.open }),
      ]);

      // Act
      const { hasFilteredLobbies, fetch } = useLobbyList();
      await fetch();

      // Assert
      expect(hasFilteredLobbies.value).toBe(true);
    });
  });
});
