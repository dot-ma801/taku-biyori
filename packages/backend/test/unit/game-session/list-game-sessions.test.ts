import { describe, expect, it, vi } from 'vitest';
import { listGameSessions } from '../../../src/game-session/application/list-game-sessions';
import type {
  ListGameSessionsRepository,
  GameSessionRow,
} from '../../../src/game-session/application/list-game-sessions';

const makeRow = (overrides: Partial<GameSessionRow> = {}): GameSessionRow => ({
  id: 'session-1',
  hostUserId: 'user-1',
  title: 'テスト卓',
  scenarioName: null,
  isPublished: false,
  openUntil: null,
  scheduledAt: null,
  completedAt: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  memberCount: 1,
  ...overrides,
});

describe('listGameSessions', () => {
  it('セッションがない場合は空配列を返す', async () => {
    // Arrange
    const repo: ListGameSessionsRepository = {
      findByUserId: vi.fn().mockResolvedValue([]),
    };

    // Act
    const result = await listGameSessions(repo, 'user-1');

    // Assert
    expect(result).toEqual([]);
  });

  it('ユーザーのセッション一覧を返す', async () => {
    // Arrange
    const row = makeRow({ isPublished: false });
    const repo: ListGameSessionsRepository = {
      findByUserId: vi.fn().mockResolvedValue([row]),
    };

    // Act
    const result = await listGameSessions(repo, 'user-1');

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'session-1',
      title: 'テスト卓',
      status: 'draft',
      isPublished: false,
      memberCount: 1,
    });
  });

  it('is_published=true で open_until 未来なら status=open', async () => {
    // Arrange
    const future = new Date();
    future.setDate(future.getDate() + 7);
    const openUntil = future.toISOString().split('T')[0]!;
    const row = makeRow({ isPublished: true, openUntil });
    const repo: ListGameSessionsRepository = {
      findByUserId: vi.fn().mockResolvedValue([row]),
    };

    // Act
    const result = await listGameSessions(repo, 'user-1');

    // Assert
    expect(result[0]?.status).toBe('open');
    expect(result[0]?.openUntil).toBe(openUntil);
  });

  it('createdAt / updatedAt が ISO 文字列で返る', async () => {
    // Arrange
    const createdAt = new Date('2025-06-01T09:00:00Z');
    const updatedAt = new Date('2025-06-02T09:00:00Z');
    const repo: ListGameSessionsRepository = {
      findByUserId: vi.fn().mockResolvedValue([makeRow({ createdAt, updatedAt })]),
    };

    // Act
    const result = await listGameSessions(repo, 'user-1');

    // Assert
    expect(result[0]?.createdAt).toBe(createdAt.toISOString());
    expect(result[0]?.updatedAt).toBe(updatedAt.toISOString());
  });

  it('findByUserId に userId を渡す', async () => {
    // Arrange
    const findByUserId = vi.fn().mockResolvedValue([]);
    const repo: ListGameSessionsRepository = { findByUserId };

    // Act
    await listGameSessions(repo, 'user-42');

    // Assert
    expect(findByUserId).toHaveBeenCalledWith('user-42');
  });
});
