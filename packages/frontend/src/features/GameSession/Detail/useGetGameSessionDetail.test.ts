import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGetGameSessionDetail } from '@/features/GameSession/Detail/useGetGameSessionDetail';
import { GameSessionStatus, LobbyStatus } from '@taku-biyori/shared';
import type { GameSessionDetailModel, SeatModel } from '@/models/game-session';
import { ApiError } from '@/lib/api-client';

vi.mock('@/api/game-session', () => ({
  getGameSession: vi.fn(),
}));

// composable を component 外で呼ぶため onMounted は no-op にし、
// 初期ロードはテスト側で明示的に fetch() を呼んで再現する。
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>();
  return { ...actual, onMounted: vi.fn() };
});

import { getGameSession } from '@/api/game-session';

const LOBBY_ID = 'lobby-1';
const SESSION_ID = 'session-1';

const makeSeat = (id: string): SeatModel => ({
  id,
  entryId: `entry-${id}`,
  userId: null,
  userName: null,
  guestName: 'ゲスト',
  characterName: null,
  seatedAt: new Date('2026-08-30T10:00:00.000Z'),
  isGuest: true,
});

const makeGameSession = (
  overrides: Partial<GameSessionDetailModel> = {},
): GameSessionDetailModel => ({
  id: SESSION_ID,
  lobbyId: LOBBY_ID,
  scheduledAt: '2999-12-31',
  status: GameSessionStatus.scheduled,
  description: null,
  title: 'ロビーの題名',
  scenarioName: null,
  location: null,
  timeLabel: null,
  overrides: {
    title: null,
    scenarioName: null,
    location: null,
    timeLabel: null,
  },
  lobby: {
    id: LOBBY_ID,
    title: 'ロビーの題名',
    scenarioName: null,
    location: null,
    maxPlayers: null,
    hostUserId: 'user-host',
    status: LobbyStatus.open,
  },
  completedAt: null,
  cancelledAt: null,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  seats: [],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fetch', () => {
  it('取得に成功すると gameSession に model が入る', async () => {
    // Arrange
    const model = makeGameSession();
    vi.mocked(getGameSession).mockResolvedValue(model);
    const { gameSession, fetch, loading } = useGetGameSessionDetail(
      LOBBY_ID,
      SESSION_ID,
    );

    // Act
    await fetch();

    // Assert
    expect(getGameSession).toHaveBeenCalledWith(LOBBY_ID, SESSION_ID);
    expect(gameSession.value).toEqual(model);
    expect(loading.value).toBe(false);
  });

  it('ApiError のメッセージをそのまま errorMessage に入れる', async () => {
    // Arrange
    vi.mocked(getGameSession).mockRejectedValue(
      new ApiError(404, '見つかりません'),
    );
    const { errorMessage, fetch } = useGetGameSessionDetail(
      LOBBY_ID,
      SESSION_ID,
    );

    // Act
    await fetch();

    // Assert
    expect(errorMessage.value).toBe('見つかりません');
  });

  it('ApiError 以外は汎用メッセージにする', async () => {
    // Arrange
    vi.mocked(getGameSession).mockRejectedValue(new Error('boom'));
    const { errorMessage, fetch } = useGetGameSessionDetail(
      LOBBY_ID,
      SESSION_ID,
    );

    // Act
    await fetch();

    // Assert
    expect(errorMessage.value).toBe('エラーが発生しました');
  });
});

describe('seats の加工', () => {
  const setup = async (seats: SeatModel[]) => {
    vi.mocked(getGameSession).mockResolvedValue(makeGameSession({ seats }));
    const composable = useGetGameSessionDetail(LOBBY_ID, SESSION_ID);
    await composable.fetch();
    return composable;
  };

  it('addSeat で着席を追加する', async () => {
    // Arrange
    const { gameSession, addSeat } = await setup([makeSeat('seat-1')]);

    // Act
    addSeat(makeSeat('seat-2'));

    // Assert
    expect(gameSession.value?.seats.map((s) => s.id)).toEqual([
      'seat-1',
      'seat-2',
    ]);
  });

  it('removeSeat で着席を取り除く', async () => {
    // Arrange
    const { gameSession, removeSeat } = await setup([
      makeSeat('seat-1'),
      makeSeat('seat-2'),
    ]);

    // Act
    removeSeat('seat-1');

    // Assert
    expect(gameSession.value?.seats.map((s) => s.id)).toEqual(['seat-2']);
  });

  it('updateSeat で既存の着席を差し替える', async () => {
    // Arrange
    const { gameSession, updateSeat } = await setup([makeSeat('seat-1')]);

    // Act
    updateSeat({ ...makeSeat('seat-1'), characterName: 'アルベルト' });

    // Assert
    expect(gameSession.value?.seats[0]?.characterName).toBe('アルベルト');
  });

  it('未取得のときは何もしない', async () => {
    // Arrange
    const { gameSession, addSeat, removeSeat, updateSeat } =
      useGetGameSessionDetail(LOBBY_ID, SESSION_ID);

    // Act
    addSeat(makeSeat('seat-1'));
    removeSeat('seat-1');
    updateSeat(makeSeat('seat-1'));

    // Assert
    expect(gameSession.value).toBeNull();
  });
});

describe('patchGameSession', () => {
  it('変化したフィールドだけを差し替える', async () => {
    // Arrange
    vi.mocked(getGameSession).mockResolvedValue(makeGameSession());
    const { gameSession, fetch, patchGameSession } = useGetGameSessionDetail(
      LOBBY_ID,
      SESSION_ID,
    );
    await fetch();

    // Act
    patchGameSession({ status: GameSessionStatus.completed });

    // Assert
    expect(gameSession.value?.status).toBe(GameSessionStatus.completed);
    expect(gameSession.value?.id).toBe(SESSION_ID);
  });
});
