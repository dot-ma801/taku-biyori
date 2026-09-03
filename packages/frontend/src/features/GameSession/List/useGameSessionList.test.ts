import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { GameSessionStatus } from '@taku-biyori/shared';
import type { GameSessionListItemModel } from '@/models/game-session';

vi.mock('@/api/game-session', () => ({
  listGameSessions: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({ useAuthStore: vi.fn() }));

import { listGameSessions } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';
import { useGameSessionList } from '@/features/GameSession/List/useGameSessionList';

const mockListGameSessions = vi.mocked(listGameSessions);

const MY_USER_ID = 'my-user-id';
const OTHER_USER_ID = 'other-user-id';

/**
 * v0.2 の `role` に相当する立ち位置。
 * v2 のレスポンスは `hostUserId` と着席者の `userId` を返すだけで role を持たないため、
 * テストの意図（自分がホスト / 着席者 / 無関係）をこの別名で表す。
 */
type Involvement = 'host' | 'member' | null;

/**
 * 今日から n 日後の日付を `YYYY-MM-DD` で返す。
 * API は DB の date 型由来で日付のみを返すため、フィクスチャも同じ形式に揃える。
 * ローカル日付で組み立て、実行環境のタイムゾーンに依存しないようにする。
 */
function daysFromToday(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function makeSession(
  overrides: Partial<GameSessionListItemModel> & { role?: Involvement } = {},
): GameSessionListItemModel {
  const { role = null, ...rest } = overrides;
  return {
    id: crypto.randomUUID(),
    lobbyId: 'lobby-1',
    title: 'テスト開催',
    scenarioName: null,
    timeLabel: null,
    status: GameSessionStatus.scheduled,
    scheduledAt: '2026-08-01',
    seatCount: 1,
    // 自分がホストのロビーか、自分が着席しているかで「自分の開催」を判定する
    hostUserId: role === 'host' ? MY_USER_ID : OTHER_USER_ID,
    seatUserIds: role === 'member' ? [MY_USER_ID] : [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...rest,
  };
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: { id: MY_USER_ID },
  } as unknown as ReturnType<typeof useAuthStore>);
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
        new Promise<GameSessionListItemModel[]>((resolve) => {
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
      expect(errorMessage.value).toBe('開催一覧の取得に失敗しました');
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
        scheduledAt: daysFromToday(1),
        role: 'host',
        status: GameSessionStatus.scheduled,
      });
      const far = makeSession({
        scheduledAt: daysFromToday(7),
        role: 'host',
        status: GameSessionStatus.scheduled,
      });
      mockListGameSessions.mockResolvedValue([far, near]);

      // Act
      const { nextSession, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(nextSession.value?.id).toBe(near.id);
    });

    // scheduledAt は日付のみ（時刻を持たない）ため、当日の開催は「これから開催される卓」として
    // nextSession に含める。時刻付きの比較にすると当日の開催が開始時刻前でも脱落する。
    it('当日の開催は nextSession に含まれる', async () => {
      // Arrange
      const todaySession = makeSession({
        scheduledAt: daysFromToday(0),
        role: 'host',
        status: GameSessionStatus.today,
      });
      mockListGameSessions.mockResolvedValue([todaySession]);

      // Act
      const { nextSession, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(nextSession.value?.id).toBe(todaySession.id);
    });

    // UTC より進んだ TZ では new Date('YYYY-MM-DD')（UTC 深夜0時）が現在時刻より
    // 前になり、当日の開催が過去と誤判定される。ローカル基準で比較していることの回帰。
    it('UTC より進んだ TZ でも当日の開催が nextSession から脱落しない', async () => {
      // Arrange
      vi.stubEnv('TZ', 'Asia/Tokyo');
      const todaySession = makeSession({
        scheduledAt: daysFromToday(0),
        role: 'host',
        status: GameSessionStatus.today,
      });
      mockListGameSessions.mockResolvedValue([todaySession]);

      // Act
      const { nextSession, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(nextSession.value?.id).toBe(todaySession.id);
    });

    it('scheduledAt が過去のセッションは nextSession に含まれない', async () => {
      // Arrange
      const past = makeSession({
        scheduledAt: daysFromToday(-1),
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
        scheduledAt: daysFromToday(1),
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
        status: GameSessionStatus.scheduled,
      });
      const publicSession = makeSession({
        role: null,
        status: GameSessionStatus.scheduled,
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
      const myScheduledSession = makeSession({
        role: 'host',
        status: GameSessionStatus.scheduled,
      });
      const myCompletedSession = makeSession({
        role: 'host',
        status: GameSessionStatus.completed,
      });
      const publicScheduledSession = makeSession({
        role: null,
        status: GameSessionStatus.scheduled,
      });
      mockListGameSessions.mockResolvedValue([
        myScheduledSession,
        myCompletedSession,
        publicScheduledSession,
      ]);

      // Act
      const { filteredMySessions, fetch } = useGameSessionList({
        statuses: [GameSessionStatus.scheduled, GameSessionStatus.today],
      });
      await fetch();

      // Assert
      expect(filteredMySessions.value).toEqual([myScheduledSession]);
    });
  });

  describe('filteredPublicSessions（公開セッションを statuses で絞り込む）', () => {
    it('statuses を指定しない場合は publicSessions をそのまま返す', async () => {
      // Arrange
      const mySession = makeSession({
        role: 'host',
        status: GameSessionStatus.scheduled,
      });
      const publicSession = makeSession({
        role: null,
        status: GameSessionStatus.scheduled,
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
      const publicScheduledSession = makeSession({
        role: null,
        status: GameSessionStatus.scheduled,
      });
      const publicCompletedSession = makeSession({
        role: null,
        status: GameSessionStatus.completed,
      });
      const myScheduledSession = makeSession({
        role: 'host',
        status: GameSessionStatus.scheduled,
      });
      mockListGameSessions.mockResolvedValue([
        publicScheduledSession,
        publicCompletedSession,
        myScheduledSession,
      ]);

      // Act
      const { filteredPublicSessions, fetch } = useGameSessionList({
        statuses: [GameSessionStatus.scheduled, GameSessionStatus.today],
      });
      await fetch();

      // Assert
      expect(filteredPublicSessions.value).toEqual([publicScheduledSession]);
    });
  });

  describe('includePublic（公開セッションを含めるか）', () => {
    it('includePublic=false の場合 filteredPublicSessions は空になる', async () => {
      // Arrange
      mockListGameSessions.mockResolvedValue([
        makeSession({ role: null, status: GameSessionStatus.completed }),
      ]);

      // Act
      const { filteredPublicSessions, fetch } = useGameSessionList({
        statuses: [GameSessionStatus.completed],
        includePublic: false,
      });
      await fetch();

      // Assert
      expect(filteredPublicSessions.value).toEqual([]);
    });

    it('includePublic=false でも自分のセッションは絞り込まれない', async () => {
      // Arrange
      const mySession = makeSession({
        role: 'host',
        status: GameSessionStatus.completed,
      });
      mockListGameSessions.mockResolvedValue([mySession]);

      // Act
      const { filteredMySessions, fetch } = useGameSessionList({
        statuses: [GameSessionStatus.completed],
        includePublic: false,
      });
      await fetch();

      // Assert
      expect(filteredMySessions.value).toEqual([mySession]);
    });

    // 終了した卓セクションは他人の開催を出さないため、公開セッションだけが該当する場合は
    // セクションごと消える必要がある。
    it('includePublic=false のとき公開セッションだけでは hasFilteredSessions が false になる', async () => {
      // Arrange
      mockListGameSessions.mockResolvedValue([
        makeSession({ role: null, status: GameSessionStatus.completed }),
      ]);

      // Act
      const { hasFilteredSessions, fetch } = useGameSessionList({
        statuses: [GameSessionStatus.completed],
        includePublic: false,
      });
      await fetch();

      // Assert
      expect(hasFilteredSessions.value).toBe(false);
    });

    it('既定では公開セッションを含む', async () => {
      // Arrange
      const publicSession = makeSession({
        role: null,
        status: GameSessionStatus.completed,
      });
      mockListGameSessions.mockResolvedValue([publicSession]);

      // Act
      const { filteredPublicSessions, fetch } = useGameSessionList({
        statuses: [GameSessionStatus.completed],
      });
      await fetch();

      // Assert
      expect(filteredPublicSessions.value).toEqual([publicSession]);
    });
  });

  describe('hasFilteredSessions（絞り込み後に表示するセッションがあるか）', () => {
    it('セッションが1件も無い場合は false になる', async () => {
      // Arrange
      mockListGameSessions.mockResolvedValue([]);

      // Act
      const { hasFilteredSessions, fetch } = useGameSessionList({
        statuses: [GameSessionStatus.scheduled],
      });
      await fetch();

      // Assert
      expect(hasFilteredSessions.value).toBe(false);
    });

    it('該当ステータスの自分のセッションがある場合は true になる', async () => {
      // Arrange
      mockListGameSessions.mockResolvedValue([
        makeSession({ role: 'host', status: GameSessionStatus.scheduled }),
      ]);

      // Act
      const { hasFilteredSessions, fetch } = useGameSessionList({
        statuses: [GameSessionStatus.scheduled],
      });
      await fetch();

      // Assert
      expect(hasFilteredSessions.value).toBe(true);
    });

    it('該当ステータスの公開セッションがある場合は true になる', async () => {
      // Arrange
      mockListGameSessions.mockResolvedValue([
        makeSession({ role: null, status: GameSessionStatus.scheduled }),
      ]);

      // Act
      const { hasFilteredSessions, fetch } = useGameSessionList({
        statuses: [GameSessionStatus.scheduled],
      });
      await fetch();

      // Assert
      expect(hasFilteredSessions.value).toBe(true);
    });

    it('statuses に該当するセッションが無い場合は false になる', async () => {
      // Arrange
      mockListGameSessions.mockResolvedValue([
        makeSession({ role: 'host', status: GameSessionStatus.scheduled }),
        makeSession({ role: null, status: GameSessionStatus.completed }),
      ]);

      // Act
      const { hasFilteredSessions, fetch } = useGameSessionList({
        statuses: [GameSessionStatus.cancelled],
      });
      await fetch();

      // Assert
      expect(hasFilteredSessions.value).toBe(false);
    });

    it('statuses 未指定の場合はセッションが1件でもあれば true になる', async () => {
      // Arrange
      mockListGameSessions.mockResolvedValue([
        makeSession({ role: null, status: GameSessionStatus.completed }),
      ]);

      // Act
      const { hasFilteredSessions, fetch } = useGameSessionList();
      await fetch();

      // Assert
      expect(hasFilteredSessions.value).toBe(true);
    });
  });

  describe('filteredMySessions（sortByScheduledAt ソート）', () => {
    it('sortByScheduledAt=true の場合 scheduledAt 昇順で返す', async () => {
      // Arrange
      const first = makeSession({
        scheduledAt: '2026-08-01',
        role: 'host',
      });
      const second = makeSession({
        scheduledAt: '2026-08-10',
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
        scheduledAt: '2026-08-10',
        role: 'host',
      });
      const s2 = makeSession({
        scheduledAt: '2026-08-01',
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
