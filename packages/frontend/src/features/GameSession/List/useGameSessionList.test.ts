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
    openUntil: null,
    memberCount: 1,
    scheduledAt: null,
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

    it('scheduledAt がないセッションは nextSession に含まれない', async () => {
      // Arrange
      const noDate = makeSession({
        scheduledAt: null,
        role: 'host',
        status: GameSessionStatus.scheduling,
      });
      mockListGameSessions.mockResolvedValue([noDate]);

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
});
