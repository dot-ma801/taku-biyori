import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@/app/presentation/controller/create-app';
import type { GameSessionListItem, GameSession } from '@taku-biyori/shared';
import type { GetGameSessionResult } from '@/game-session/application/get-game-session';
import type { UpdateGameSessionStatusResult } from '@/game-session/application/update-game-session-status';

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

const mockGameSessionDetail = {
  ...mockGameSession,
  members: [],
};

const mockGetOk: GetGameSessionResult = {
  type: 'ok',
  gameSession: mockGameSessionDetail,
};

const makeApp = (
  overrides: {
    getSession?: () => Promise<typeof mockSession | null>;
    listGameSessions?: (userId: string) => Promise<GameSessionListItem[]>;
    createGameSession?: (
      userId: string,
      input: unknown,
    ) => Promise<GameSession>;
    getGameSession?: (
      id: string,
      userId: string | null,
    ) => Promise<GetGameSessionResult>;
    updateGameSession?: (
      id: string,
      userId: string,
      input: unknown,
    ) => Promise<
      | { type: 'ok'; gameSession: GameSession }
      | { type: 'notFound' }
      | { type: 'forbidden' }
    >;
    deleteGameSession?: (
      id: string,
      userId: string,
    ) => Promise<{ type: 'ok' } | { type: 'notFound' } | { type: 'forbidden' }>;
    updateGameSessionStatus?: (
      id: string,
      userId: string,
      input: unknown,
    ) => Promise<UpdateGameSessionStatusResult>;
  } = {},
) =>
  createApp({
    frontendOrigin: 'http://localhost:5173',
    authHandler: vi.fn(async () => new Response('ok')),
    getSession: overrides.getSession ?? vi.fn().mockResolvedValue(mockSession),
    listGameSessions:
      overrides.listGameSessions ?? vi.fn().mockResolvedValue([mockListItem]),
    createGameSession:
      overrides.createGameSession ?? vi.fn().mockResolvedValue(mockGameSession),
    getGameSession:
      overrides.getGameSession ?? vi.fn().mockResolvedValue(mockGetOk),
    updateGameSession:
      overrides.updateGameSession ??
      vi.fn().mockResolvedValue({ type: 'ok', gameSession: mockGameSession }),
    deleteGameSession:
      overrides.deleteGameSession ?? vi.fn().mockResolvedValue({ type: 'ok' }),
    updateGameSessionStatus:
      overrides.updateGameSessionStatus ??
      vi.fn().mockResolvedValue({ type: 'ok', gameSession: mockGameSession }),
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

describe('GET /api/game-sessions/:id', () => {
  it('認証済みなら 200 で詳細を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/game-sessions/session-1');
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockGameSessionDetail);
  });

  it('公開済みセッションは未認証でも 200 を返す', async () => {
    // Arrange
    const app = makeApp({
      getSession: vi.fn().mockResolvedValue(null),
      getGameSession: vi.fn().mockResolvedValue(mockGetOk),
    });

    // Act
    const response = await app.request('/api/game-sessions/session-1');

    // Assert
    expect(response.status).toBe(200);
  });

  it('存在しないセッションなら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      getGameSession: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request('/api/game-sessions/nonexistent');

    // Assert
    expect(response.status).toBe(404);
  });

  it('非公開セッションにホスト以外がアクセスすると 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      getGameSession: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request('/api/game-sessions/session-1');

    // Assert
    expect(response.status).toBe(403);
  });

  it('非公開セッションに未認証でアクセスすると 401 を返す', async () => {
    // Arrange
    const app = makeApp({
      getSession: vi.fn().mockResolvedValue(null),
      getGameSession: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request('/api/game-sessions/session-1');

    // Assert
    expect(response.status).toBe(401);
  });

  it('userId を getGameSession に渡す', async () => {
    // Arrange
    const getGameSession = vi.fn().mockResolvedValue(mockGetOk);
    const app = makeApp({ getGameSession });

    // Act
    await app.request('/api/game-sessions/session-1');

    // Assert
    expect(getGameSession).toHaveBeenCalledWith('session-1', 'user-1');
  });
});

describe('PATCH /api/game-sessions/:id', () => {
  it('ホストが更新すると 200 とセッションを返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/game-sessions/session-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '更新後' }),
    });
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockGameSession);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request('/api/game-sessions/session-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '更新後' }),
    });

    // Assert
    expect(response.status).toBe(401);
  });

  it('ホストでない場合は 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateGameSession: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request('/api/game-sessions/session-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '更新後' }),
    });

    // Assert
    expect(response.status).toBe(403);
  });

  it('存在しないセッションなら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateGameSession: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request('/api/game-sessions/session-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '更新後' }),
    });

    // Assert
    expect(response.status).toBe(404);
  });

  it('空ボディなら 400 を返す（最低1フィールド必要）', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/game-sessions/session-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    // Assert
    expect(response.status).toBe(400);
  });

  it('title が空文字なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/game-sessions/session-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    });

    // Assert
    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/game-sessions/:id', () => {
  it('ホストが削除すると 204 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/game-sessions/session-1', {
      method: 'DELETE',
    });

    // Assert
    expect(response.status).toBe(204);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request('/api/game-sessions/session-1', {
      method: 'DELETE',
    });

    // Assert
    expect(response.status).toBe(401);
  });

  it('ホストでない場合は 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      deleteGameSession: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request('/api/game-sessions/session-1', {
      method: 'DELETE',
    });

    // Assert
    expect(response.status).toBe(403);
  });

  it('存在しないセッションなら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      deleteGameSession: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request('/api/game-sessions/session-1', {
      method: 'DELETE',
    });

    // Assert
    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/game-sessions/:id/status', () => {
  it('ホストが draft → open に遷移すると 200 とセッションを返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/game-sessions/session-1/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    });
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockGameSession);
  });

  it('ホストが today → completed に遷移すると 200 とセッションを返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/game-sessions/session-1/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });

    // Assert
    expect(response.status).toBe(200);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request('/api/game-sessions/session-1/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    });

    // Assert
    expect(response.status).toBe(401);
  });

  it('ホストでない場合は 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateGameSessionStatus: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request('/api/game-sessions/session-1/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    });

    // Assert
    expect(response.status).toBe(403);
  });

  it('存在しないセッションなら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateGameSessionStatus: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request('/api/game-sessions/session-1/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    });

    // Assert
    expect(response.status).toBe(404);
  });

  it('不正な遷移なら 409 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateGameSessionStatus: vi
        .fn()
        .mockResolvedValue({ type: 'invalidTransition' }),
    });

    // Act
    const response = await app.request('/api/game-sessions/session-1/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    });

    // Assert
    expect(response.status).toBe(409);
  });

  it('不正な status 値なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/game-sessions/session-1/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'scheduling' }),
    });

    // Assert
    expect(response.status).toBe(400);
  });

  it('ユースケースに id と userId と input を渡す', async () => {
    // Arrange
    const updateGameSessionStatus = vi
      .fn()
      .mockResolvedValue({ type: 'ok', gameSession: mockGameSession });
    const app = makeApp({ updateGameSessionStatus });

    // Act
    await app.request('/api/game-sessions/session-1/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    });

    // Assert
    expect(updateGameSessionStatus).toHaveBeenCalledWith(
      'session-1',
      'user-1',
      { status: 'open' },
    );
  });
});
