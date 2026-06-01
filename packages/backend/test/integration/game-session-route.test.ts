import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app/presentation/controller/create-app';
import type { GameSessionListItem, GameSession } from '@taku-biyori/shared';

const mockSession = { user: { id: 'user-1' } };

const mockListItem: GameSessionListItem = {
  id: 'session-1',
  title: 'テスト卓',
  status: 'draft',
  isPublished: false,
  memberCount: 1,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockGameSession: GameSession = {
  id: 'session-1',
  title: '新規卓',
  status: 'draft',
  isPublished: false,
  createdBy: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const makeApp = (overrides: {
  getSession?: () => Promise<typeof mockSession | null>;
  listGameSessions?: (userId: string) => Promise<GameSessionListItem[]>;
  createGameSession?: (userId: string, input: unknown) => Promise<GameSession>;
} = {}) =>
  createApp({
    frontendOrigin: 'http://localhost:5173',
    authHandler: vi.fn(async () => new Response('ok')),
    getSession: overrides.getSession ?? vi.fn().mockResolvedValue(mockSession),
    listGameSessions: overrides.listGameSessions ?? vi.fn().mockResolvedValue([mockListItem]),
    createGameSession: overrides.createGameSession ?? vi.fn().mockResolvedValue(mockGameSession),
  });

describe('GET /api/game-sessions', () => {
  it('認証済みなら 200 でセッション一覧を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/game-sessions');
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual([mockListItem]);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({
      getSession: vi.fn().mockResolvedValue(null),
    });

    // Act
    const response = await app.request('/api/game-sessions');

    // Assert
    expect(response.status).toBe(401);
  });

  it('userId をユースケースに渡す', async () => {
    // Arrange
    const listGameSessions = vi.fn().mockResolvedValue([]);
    const app = makeApp({ listGameSessions });

    // Act
    await app.request('/api/game-sessions');

    // Assert
    expect(listGameSessions).toHaveBeenCalledWith('user-1');
  });
});

describe('POST /api/game-sessions', () => {
  it('有効なボディで 201 とセッションを返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/game-sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '新規卓' }),
    });
    const body = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(body).toEqual(mockGameSession);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({
      getSession: vi.fn().mockResolvedValue(null),
    });

    // Act
    const response = await app.request('/api/game-sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '卓' }),
    });

    // Assert
    expect(response.status).toBe(401);
  });

  it('title が空なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/game-sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    });

    // Assert
    expect(response.status).toBe(400);
  });

  it('title が不正なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/game-sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    // Assert
    expect(response.status).toBe(400);
  });

  it('ユースケースに userId と入力を渡す', async () => {
    // Arrange
    const createGameSession = vi.fn().mockResolvedValue(mockGameSession);
    const app = makeApp({ createGameSession });

    // Act
    await app.request('/api/game-sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '詳細卓', maxMembers: 4 }),
    });

    // Assert
    expect(createGameSession).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ title: '詳細卓', maxMembers: 4 }),
    );
  });
});
