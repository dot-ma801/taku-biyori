import { describe, expect, it, vi } from 'vitest';
import { updateGameSession } from '@/game-session/application/update-game-session';
import type { UpdateGameSessionRepository } from '@/game-session/application/update-game-session';
import type { GameSession } from '@taku-biyori/shared';
import { GameSessionStatus, LobbyStatus } from '@taku-biyori/shared';

const LOBBY_ID = 'lobby-1';
const HOST = 'user-host';

const updated: GameSession = {
  id: 'session-1',
  lobbyId: LOBBY_ID,
  scheduledAt: '2026-09-01',
  status: GameSessionStatus.scheduled,
  description: null,
  overrides: { title: null, scenarioName: null, location: null, timeLabel: null },
  lobby: {
    id: LOBBY_ID,
    title: 'マダミス「蒼き月」',
    scenarioName: null,
    location: null,
    maxPlayers: null,
    hostUserId: HOST,
    status: LobbyStatus.open,
  },
  completedAt: null,
  cancelledAt: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<UpdateGameSessionRepository> = {},
): UpdateGameSessionRepository => ({
  findLobbyId: vi.fn().mockResolvedValue(LOBBY_ID),
  findHostUserId: vi.fn().mockResolvedValue(HOST),
  findStatusFields: vi.fn().mockResolvedValue({
    scheduledAt: '2026-09-01',
    completedAt: null,
    cancelledAt: null,
  }),
  updateById: vi.fn().mockResolvedValue(updated),
  ...overrides,
});

describe('updateGameSession', () => {
  it('ホストは開催情報を更新できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await updateGameSession(repo, LOBBY_ID, 'session-1', HOST, {
      location: 'カフェ〇〇',
    });

    // Assert
    expect(result).toEqual({ type: 'ok', gameSession: updated });
  });

  it('存在しなければ notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({ findLobbyId: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await updateGameSession(repo, LOBBY_ID, 'session-1', HOST, {
      location: 'x',
    });

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('URL の lobbyId が所属ロビーと違えば notFound を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await updateGameSession(repo, 'lobby-other', 'session-1', HOST, {
      location: 'x',
    });

    // Assert
    expect(result).toEqual({ type: 'notFound' });
    expect(repo.updateById).not.toHaveBeenCalled();
  });

  it('ホスト以外は forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await updateGameSession(repo, LOBBY_ID, 'session-1', 'user-2', {
      location: 'x',
    });

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('中止した開催は編集できない', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        scheduledAt: '2026-09-01',
        completedAt: null,
        cancelledAt: new Date('2026-08-20T00:00:00.000Z'),
      }),
    });

    // Act
    const result = await updateGameSession(repo, LOBBY_ID, 'session-1', HOST, {
      location: 'x',
    });

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
  });

  it('完了した開催は編集できる（あとから連絡事項を直す運用があるため）', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        scheduledAt: '2026-09-01',
        completedAt: new Date('2026-09-01T22:00:00.000Z'),
        cancelledAt: null,
      }),
    });

    // Act
    const result = await updateGameSession(repo, LOBBY_ID, 'session-1', HOST, {
      description: 'おつかれさまでした',
    });

    // Assert
    expect(result.type).toBe('ok');
  });

  it('上書き項目の null（解除）をそのままリポジトリへ渡す', async () => {
    // Arrange
    // null と「キーの省略」を潰すと、上書き解除ができなくなる（design-v2 §6-13-5）
    const repo = makeRepo();

    // Act
    await updateGameSession(repo, LOBBY_ID, 'session-1', HOST, { title: null });

    // Assert
    expect(repo.updateById).toHaveBeenCalledWith('session-1', { title: null });
  });
});
