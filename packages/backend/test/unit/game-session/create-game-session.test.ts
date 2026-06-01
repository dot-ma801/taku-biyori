import { describe, expect, it, vi } from 'vitest';
import { createGameSession } from '../../../src/game-session/application/create-game-session';
import type {
  CreateGameSessionRepository,
  CreatedGameSessionRow,
} from '../../../src/game-session/application/create-game-session';

const makeRow = (overrides: Partial<CreatedGameSessionRow> = {}): CreatedGameSessionRow => ({
  id: 'session-1',
  hostUserId: 'user-1',
  title: 'テスト卓',
  scenarioName: null,
  description: null,
  maxPlayers: null,
  isPublished: false,
  openUntil: null,
  scheduledAt: null,
  completedAt: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  ...overrides,
});

describe('createGameSession', () => {
  it('ユースケースが GameSession を返す', async () => {
    // Arrange
    const row = makeRow();
    const repo: CreateGameSessionRepository = {
      createWithHost: vi.fn().mockResolvedValue(row),
    };

    // Act
    const result = await createGameSession(repo, 'user-1', { title: 'テスト卓' });

    // Assert
    expect(result).toMatchObject({
      id: 'session-1',
      title: 'テスト卓',
      status: 'draft',
      isPublished: false,
      createdBy: 'user-1',
    });
  });

  it('createWithHost に hostUserId と title を渡す', async () => {
    // Arrange
    const createWithHost = vi.fn().mockResolvedValue(makeRow());
    const repo: CreateGameSessionRepository = { createWithHost };

    // Act
    await createGameSession(repo, 'user-99', { title: 'マイ卓' });

    // Assert
    expect(createWithHost).toHaveBeenCalledWith(
      expect.objectContaining({ hostUserId: 'user-99', title: 'マイ卓' }),
    );
  });

  it('guestLinkToken が 16 バイト base64url 形式で渡される', async () => {
    // Arrange
    const createWithHost = vi.fn().mockResolvedValue(makeRow());
    const repo: CreateGameSessionRepository = { createWithHost };

    // Act
    await createGameSession(repo, 'user-1', { title: '卓' });

    // Assert
    const { guestLinkToken } = createWithHost.mock.calls[0]![0];
    // base64url: A-Z a-z 0-9 - _  (no padding)
    expect(guestLinkToken).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(guestLinkToken.length).toBeGreaterThan(10);
  });

  it('オプションフィールドを createWithHost に渡す', async () => {
    // Arrange
    const createWithHost = vi.fn().mockResolvedValue(makeRow());
    const repo: CreateGameSessionRepository = { createWithHost };

    // Act
    await createGameSession(repo, 'user-1', {
      title: '詳細卓',
      description: '説明文',
      scenarioName: 'シナリオ名',
      maxMembers: 5,
      openUntil: '2025-09-01',
    });

    // Assert
    expect(createWithHost).toHaveBeenCalledWith(
      expect.objectContaining({
        description: '説明文',
        scenarioName: 'シナリオ名',
        maxPlayers: 5,
        openUntil: '2025-09-01',
      }),
    );
  });

  it('maxPlayers / description を正しく response にマッピングする', async () => {
    // Arrange
    const row = makeRow({ maxPlayers: 4, description: '概要' });
    const repo: CreateGameSessionRepository = {
      createWithHost: vi.fn().mockResolvedValue(row),
    };

    // Act
    const result = await createGameSession(repo, 'user-1', { title: '卓' });

    // Assert
    expect(result.maxMembers).toBe(4);
    expect(result.description).toBe('概要');
  });

  it('completedAt が ISO 文字列で返る', async () => {
    // Arrange
    const completedAt = new Date('2025-08-10T15:00:00Z');
    const row = makeRow({ completedAt, isPublished: true, scheduledAt: '2025-08-10' });
    const repo: CreateGameSessionRepository = {
      createWithHost: vi.fn().mockResolvedValue(row),
    };

    // Act
    const result = await createGameSession(repo, 'user-1', { title: '卓' });

    // Assert
    expect(result.completedAt).toBe(completedAt.toISOString());
    expect(result.status).toBe('completed');
  });
});
