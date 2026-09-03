import { describe, expect, it } from 'vitest';
import {
  GameSessionStatusSchema,
  GameSessionSchema,
  GameSessionListItemSchema,
  GameSessionSummarySchema,
} from '@/game-session';

const GAME_SESSION_ID = '11111111-1111-4111-8111-111111111111';
const LOBBY_ID = '22222222-2222-4222-8222-222222222222';
const SEAT_ID = '33333333-3333-4333-8333-333333333333';

// design-v2 §4-2 で導出される4ステータス
const V2_STATUSES = ['scheduled', 'today', 'completed', 'cancelled'];
// v0.2 にあって v2 で廃止した値。復活させないための番人として弾けることを確認する
const RETIRED_STATUSES = ['draft', 'open', 'scheduling'];

const makeGameSession = (status: string) => ({
  id: GAME_SESSION_ID,
  lobbyId: LOBBY_ID,
  scheduledAt: '2026-09-01',
  status,
  description: null,
  overrides: {
    title: null,
    scenarioName: null,
    location: null,
    timeLabel: null,
  },
  lobby: {
    id: LOBBY_ID,
    title: 'ロビー',
    scenarioName: null,
    location: null,
    maxPlayers: null,
    hostUserId: 'user-1',
    status: 'open',
  },
  completedAt: null,
  cancelledAt: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
});

const makeGameSessionListItem = (status: string) => ({
  id: GAME_SESSION_ID,
  lobbyId: LOBBY_ID,
  title: '第1回',
  scenarioName: null,
  status,
  scheduledAt: '2026-09-01',
  timeLabel: null,
  seats: [{ id: SEAT_ID, userId: 'user-1' }],
  hostUserId: 'user-1',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
});

const makeGameSessionSummary = (status: string) => ({
  id: GAME_SESSION_ID,
  scheduledAt: '2026-09-01',
  status,
  title: '第1回',
  timeLabel: null,
  seats: [{ id: SEAT_ID, userId: 'user-1' }],
});

describe('GameSessionStatusSchema', () => {
  it.each(V2_STATUSES)('%s を受け付ける（design-v2 §4-2）', (status) => {
    // Arrange
    const input = status;

    // Act
    const result = GameSessionStatusSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it.each(RETIRED_STATUSES)(
    '%s は受け付けない（v0.2 の値は v2 の契約に含まれない）',
    (status) => {
      // Arrange
      const input = status;

      // Act
      const result = GameSessionStatusSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    },
  );
});

describe('v2 レスポンス契約のステータス', () => {
  it.each(V2_STATUSES)('GameSessionSchema は %s を受け付ける', (status) => {
    // Arrange
    const input = makeGameSession(status);

    // Act
    const result = GameSessionSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it.each(RETIRED_STATUSES)('GameSessionSchema は %s を弾く', (status) => {
    // Arrange
    const input = makeGameSession(status);

    // Act
    const result = GameSessionSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it.each(RETIRED_STATUSES)(
    'GameSessionListItemSchema は %s を弾く',
    (status) => {
      // Arrange
      const input = makeGameSessionListItem(status);

      // Act
      const result = GameSessionListItemSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    },
  );

  it.each(RETIRED_STATUSES)(
    'GameSessionSummarySchema は %s を弾く',
    (status) => {
      // Arrange
      const input = makeGameSessionSummary(status);

      // Act
      const result = GameSessionSummarySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    },
  );
});
