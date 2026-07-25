import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameSessionStatus } from '@taku-biyori/shared';
import type { GameSessionListItem } from '@taku-biyori/shared';

vi.mock('@/api/game-session', () => ({
  listGameSessions: vi.fn(),
}));

import { listGameSessions } from '@/api/game-session';
import { useGameSessionList } from '@/features/GameSession/List/useGameSessionList';

const mockListGameSessions = vi.mocked(listGameSessions);

function makeSession(
  overrides: Partial<GameSessionListItem> = {},
): GameSessionListItem {
  return {
    id: crypto.randomUUID(),
    title: 'テストセッション',
    scenarioName: null,
    status: GameSessionStatus.draft,
    isPublished: false,
    memberCount: 1,
    scheduledAt: '2026-08-01T10:00:00Z',
    role: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useGameSessionList', () => {
  describe('データ取得', () => {
    it('マウント時に listGameSessions を呼び出す', async () => {
      // Arrange
      mockListGameSessions.mockResolvedValue([]);

      // Act
      const { fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(mockListGameSessions).toHaveBeenCalledOnce();
    });

    it('取得成功時は allSessions に結果が格納される', async () => {
      // Arrange
      const sessions = [makeSession(), makeSession()];
      mockListGameSessions.mockResolvedValue(sessions);

      // Act
      const { allSessions, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(allSessions.value).toEqual(sessions);
    });

    it('取得中は loading が true になる', async () => {
      // Arrange
      let resolveFetch!: () => void;
      mockListGameSessions.mockReturnValue(
        new Promise<GameSessionListItem[]>((resolve) => {
          resolveFetch = () => resolve([]);
        }),
      );

      // Act
      const { loading, fetch } = useGameSessionList();
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
      mockListGameSessions.mockRejectedValue(new Error('Network error'));

      // Act
      const { errorMessage, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(errorMessage.value).toBe('セッション一覧の取得に失敗しました');
    });

    it('取得失敗時は loading が false に戻る', async () => {
      // Arrange
      mockListGameSessions.mockRejectedValue(new Error('Network error'));

      // Act
      const { loading, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(loading.value).toBe(false);
    });
  });

  describe('publicSessions（自分が関わっていないセッション）', () => {
    it('role=null のセッションのみ含む', async () => {
      // Arrange
      const publicSession = makeSession({ role: null });
      const mySession = makeSession({ role: 'host' });
      mockListGameSessions.mockResolvedValue([publicSession, mySession]);

      // Act
      const { publicSessions, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(publicSessions.value).toEqual([publicSession]);
    });

    it('該当セッションがない場合は空配列になる', async () => {
      // Arrange
      mockListGameSessions.mockResolvedValue([makeSession({ role: 'host' })]);

      // Act
      const { publicSessions, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(publicSessions.value).toHaveLength(0);
    });
  });

  describe('mySessions（自分が関わるセッション）', () => {
    it('role=host のセッションを含む', async () => {
      // Arrange
      const mySession = makeSession({ role: 'host' });
      mockListGameSessions.mockResolvedValue([mySession]);

      // Act
      const { mySessions, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(mySessions.value).toContainEqual(mySession);
    });

    it('role=member のセッションを含む', async () => {
      // Arrange
      const mySession = makeSession({ role: 'member' });
      mockListGameSessions.mockResolvedValue([mySession]);

      // Act
      const { mySessions, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(mySessions.value).toContainEqual(mySession);
    });

    it('role=null のセッションは含まない', async () => {
      // Arrange
      const publicSession = makeSession({ role: null });
      mockListGameSessions.mockResolvedValue([publicSession]);

      // Act
      const { mySessions, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(mySessions.value).not.toContainEqual(publicSession);
    });
  });

  describe('nextSession（次の卓）', () => {
    it('mySessions の中で最も近い未来の scheduledAt を持つセッションを返す', async () => {
      // Arrange
      const near = makeSession({
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 1日後
        role: 'host',
        status: GameSessionStatus.confirmed,
      });
      const far = makeSession({
        scheduledAt: new Date(
          Date.now() + 1000 * 60 * 60 * 24 * 7,
        ).toISOString(), // 7日後
        role: 'host',
        status: GameSessionStatus.confirmed,
      });
      mockListGameSessions.mockResolvedValue([far, near]);

      // Act
      const { nextSession, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(nextSession.value?.id).toBe(near.id);
    });

    it('scheduledAt が過去のセッションは nextSession に含まれない', async () => {
      // Arrange
      const past = makeSession({
        scheduledAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1時間前
        role: 'host',
        status: GameSessionStatus.completed,
      });
      mockListGameSessions.mockResolvedValue([past]);

      // Act
      const { nextSession, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(nextSession.value).toBeNull();
    });

    it('role=null のセッションは nextSession の対象外になる', async () => {
      // Arrange
      const publicSession = makeSession({
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        role: null,
      });
      mockListGameSessions.mockResolvedValue([publicSession]);

      // Act
      const { nextSession, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(nextSession.value).toBeNull();
    });

    it('mySessions が空の場合は null を返す', async () => {
      // Arrange
      mockListGameSessions.mockResolvedValue([]);

      // Act
      const { nextSession, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(nextSession.value).toBeNull();
    });
  });

  describe('filteredMySessions（自分のセッションを statuses で絞り込む）', () => {
    it('statuses を指定しない場合は mySessions をそのまま返す', async () => {
      // Arrange
      const mySession = makeSession({
        role: 'host',
        status: GameSessionStatus.draft,
      });
      const publicSession = makeSession({
        role: null,
        status: GameSessionStatus.draft,
      });
      mockListGameSessions.mockResolvedValue([mySession, publicSession]);

      // Act
      const { filteredMySessions, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(filteredMySessions.value).toEqual([mySession]);
    });

    it('statuses を指定した場合は自分のセッションのうち該当ステータスのみ返す', async () => {
      // Arrange
      const myConfirmedSession = makeSession({
        role: 'host',
        status: GameSessionStatus.confirmed,
      });
      const myDraftSession = makeSession({
        role: 'host',
        status: GameSessionStatus.draft,
      });
      const publicConfirmedSession = makeSession({
        role: null,
        status: GameSessionStatus.confirmed,
      });
      mockListGameSessions.mockResolvedValue([
        myConfirmedSession,
        myDraftSession,
        publicConfirmedSession,
      ]);

      // Act
      const { filteredMySessions, fetch } = useGameSessionList({
        statuses: [GameSessionStatus.confirmed, GameSessionStatus.today],
      });
      await fetch();

      // Assert
      expect(filteredMySessions.value).toEqual([myConfirmedSession]);
    });
  });

  describe('filteredPublicSessions（公開セッションを statuses で絞り込む）', () => {
    it('statuses を指定しない場合は publicSessions をそのまま返す', async () => {
      // Arrange
      const mySession = makeSession({
        role: 'host',
        status: GameSessionStatus.draft,
      });
      const publicSession = makeSession({
        role: null,
        status: GameSessionStatus.draft,
      });
      mockListGameSessions.mockResolvedValue([mySession, publicSession]);

      // Act
      const { filteredPublicSessions, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(filteredPublicSessions.value).toEqual([publicSession]);
    });

    it('statuses を指定した場合は公開セッションのうち該当ステータスのみ返す', async () => {
      // Arrange
      const publicConfirmedSession = makeSession({
        role: null,
        status: GameSessionStatus.confirmed,
      });
      const publicDraftSession = makeSession({
        role: null,
        status: GameSessionStatus.draft,
      });
      const myConfirmedSession = makeSession({
        role: 'host',
        status: GameSessionStatus.confirmed,
      });
      mockListGameSessions.mockResolvedValue([
        publicConfirmedSession,
        publicDraftSession,
        myConfirmedSession,
      ]);

      // Act
      const { filteredPublicSessions, fetch } = useGameSessionList({
        statuses: [GameSessionStatus.confirmed, GameSessionStatus.today],
      });
      await fetch();

      // Assert
      expect(filteredPublicSessions.value).toEqual([publicConfirmedSession]);
    });
  });

  describe('filteredMySessions（sortByScheduledAt ソート）', () => {
    it('sortByScheduledAt=true の場合 scheduledAt 昇順で返す', async () => {
      // Arrange
      const first = makeSession({
        scheduledAt: '2026-08-01T10:00:00Z',
        role: 'host',
      });
      const second = makeSession({
        scheduledAt: '2026-08-10T10:00:00Z',
        role: 'host',
      });
      mockListGameSessions.mockResolvedValue([second, first]);

      // Act
      const { filteredMySessions, fetch } = useGameSessionList({
        sortByScheduledAt: true,
      });
      await fetch();

      // Assert
      expect(filteredMySessions.value[0]?.id).toBe(first.id);
      expect(filteredMySessions.value[1]?.id).toBe(second.id);
    });

    it('sortByScheduledAt=false の場合は元の順序を保つ', async () => {
      // Arrange
      const s1 = makeSession({
        scheduledAt: '2026-08-10T10:00:00Z',
        role: 'host',
      });
      const s2 = makeSession({
        scheduledAt: '2026-08-01T10:00:00Z',
        role: 'host',
      });
      mockListGameSessions.mockResolvedValue([s1, s2]);

      // Act
      const { filteredMySessions, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(filteredMySessions.value[0]?.id).toBe(s1.id);
      expect(filteredMySessions.value[1]?.id).toBe(s2.id);
    });
  });
});
