import { GameSessionStatus, LobbyStatus } from '@taku-biyori/shared';
import type {
  GameSessionDetailModel,
  GameSessionModel,
  SeatModel,
} from '@/models/game-session';

/**
 * テスト用のセッション model ファクトリ。
 *
 * model はフィールドが多く、テストごとに書き下すと本質でない差分がノイズになるため
 * ここに集約する。**テストからのみ import すること**（本体のコードでは使わない）。
 */

export const FIXTURE_LOBBY_ID = 'lobby-1';
export const FIXTURE_SESSION_ID = 'session-1';
export const FIXTURE_HOST_USER_ID = 'host-user-id';

export const makeSeatModel = (
  overrides: Partial<SeatModel> = {},
): SeatModel => ({
  id: 'seat-1',
  entryId: 'entry-1',
  userId: 'member-user-id',
  userName: 'テストユーザー',
  guestName: null,
  characterName: null,
  seatedAt: new Date('2026-08-01T00:00:00.000Z'),
  isGuest: false,
  ...overrides,
});

export const makeGameSessionModel = (
  overrides: Partial<GameSessionModel> = {},
): GameSessionModel => ({
  id: FIXTURE_SESSION_ID,
  lobbyId: FIXTURE_LOBBY_ID,
  scheduledAt: '2026-08-01',
  status: GameSessionStatus.scheduled,
  description: null,
  title: 'テストロビー',
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
    id: FIXTURE_LOBBY_ID,
    title: 'テストロビー',
    scenarioName: null,
    location: null,
    maxPlayers: null,
    hostUserId: FIXTURE_HOST_USER_ID,
    status: LobbyStatus.open,
  },
  completedAt: null,
  cancelledAt: null,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  ...overrides,
});

export const makeGameSessionDetailModel = (
  overrides: Partial<GameSessionDetailModel> = {},
): GameSessionDetailModel => ({
  ...makeGameSessionModel(overrides),
  seats: overrides.seats ?? [makeSeatModel()],
});
