import { describe, expect, it, vi } from 'vitest';
import { updateGameSessionStatus } from '@/game-session/application/update-game-session-status';
import type { UpdateGameSessionStatusRepository } from '@/game-session/application/update-game-session-status';
import type { GameSession } from '@taku-biyori/shared';
import { GameSessionStatus, LobbyStatus } from '@taku-biyori/shared';

const LOBBY_ID = 'lobby-1';
const HOST = 'user-host';
const NOW = new Date('2026-08-30T10:00:00.000Z');
const TODAY = '2026-08-30';

const session: GameSession = {
  id: 'session-1',
  lobbyId: LOBBY_ID,
  scheduledAt: TODAY,
  status: GameSessionStatus.today,
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
    hostUserId: HOST,
    status: LobbyStatus.open,
  },
  completedAt: null,
  cancelledAt: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<UpdateGameSessionStatusRepository> = {},
): UpdateGameSessionStatusRepository => ({
  findLobbyId: vi.fn().mockResolvedValue(LOBBY_ID),
  findHostUserId: vi.fn().mockResolvedValue(HOST),
  findStatusFields: vi.fn().mockResolvedValue({
    scheduledAt: TODAY,
    completedAt: null,
    cancelledAt: null,
  }),
  complete: vi
    .fn()
    .mockResolvedValue({ ...session, completedAt: NOW.toISOString() }),
  cancel: vi
    .fn()
    .mockResolvedValue({ ...session, cancelledAt: NOW.toISOString() }),
  ...overrides,
});

describe('updateGameSessionStatus', () => {
  it('当日の開催を完了にできる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await updateGameSessionStatus(
      repo,
      LOBBY_ID,
      'session-1',
      HOST,
      { status: 'completed' },
      NOW,
    );

    // Assert
    expect(result.type).toBe('ok');
    expect(repo.complete).toHaveBeenCalledWith('session-1', NOW);
  });

  it('開催日を過ぎた scheduled も完了にできる（完了操作を忘れたケースを救う）', async () => {
    // Arrange
    // v0.2 は today のみ許可していた（design-v2 §6-13-6）
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        scheduledAt: '2026-08-01',
        completedAt: null,
        cancelledAt: null,
      }),
    });

    // Act
    const result = await updateGameSessionStatus(
      repo,
      LOBBY_ID,
      'session-1',
      HOST,
      { status: 'completed' },
      NOW,
    );

    // Assert
    expect(result.type).toBe('ok');
  });

  it('中止も完了と同じくポリシー表を通して判定する', async () => {
    // Arrange
    // v0.2 は cancelled への遷移だけ canPerform を通さずハードコードしていた（design-v2 §4-5）
    const repo = makeRepo();

    // Act
    const result = await updateGameSessionStatus(
      repo,
      LOBBY_ID,
      'session-1',
      HOST,
      { status: 'cancelled' },
      NOW,
    );

    // Assert
    expect(result.type).toBe('ok');
    expect(repo.cancel).toHaveBeenCalledWith('session-1', NOW);
  });

  it.each([
    ['completed' as const, { completedAt: NOW, cancelledAt: null }],
    ['cancelled' as const, { completedAt: null, cancelledAt: NOW }],
  ])(
    'すでに終端なら %s への遷移を invalidTransition にする',
    async (target, terminal) => {
      // Arrange
      const repo = makeRepo({
        findStatusFields: vi
          .fn()
          .mockResolvedValue({ scheduledAt: TODAY, ...terminal }),
      });

      // Act
      const result = await updateGameSessionStatus(
        repo,
        LOBBY_ID,
        'session-1',
        HOST,
        { status: target },
        NOW,
      );

      // Assert
      expect(result).toEqual({ type: 'invalidTransition' });
    },
  );

  it('ホスト以外は forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await updateGameSessionStatus(
      repo,
      LOBBY_ID,
      'session-1',
      'user-2',
      { status: 'completed' },
      NOW,
    );

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('URL の lobbyId が所属ロビーと違えば notFound を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await updateGameSessionStatus(
      repo,
      'lobby-other',
      'session-1',
      HOST,
      { status: 'completed' },
      NOW,
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('条件付き UPDATE が0件なら invalidTransition を返す（並行遷移の敗北）', async () => {
    // Arrange
    const repo = makeRepo({ complete: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await updateGameSessionStatus(
      repo,
      LOBBY_ID,
      'session-1',
      HOST,
      { status: 'completed' },
      NOW,
    );

    // Assert
    expect(result).toEqual({ type: 'invalidTransition' });
  });
});
