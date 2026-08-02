import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@/app/presentation/controller/create-app';
import type { GameSessionUseCases } from '@/game-session/application/use-cases';
import type { ProfileUseCases } from '@/profile/application/use-cases';
import type { LobbyUseCases } from '@/lobby/application/use-cases';
import type {
  GameSessionListItem,
  GameSession,
  GameSessionPlayMemo,
} from '@taku-biyori/shared';
import type { GetGameSessionResult } from '@/game-session/application/get-game-session';

const mockSession = { user: { id: 'user-1' } };

/** 卓作成の scheduledAt に使う十分に未来の日付（過去日バリデーションを踏まない） */
const FUTURE_DATE = '2999-12-31';

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

const mockPlayMemo: GameSessionPlayMemo = {
  memberId: '00000000-0000-4000-8000-000000000001',
  body: 'メモ',
  sharedAt: null,
  updatedAt: '2026-08-02T00:00:00.000Z',
};

const stubProfile = {} as unknown as ProfileUseCases;
const stubLobby = {} as unknown as LobbyUseCases;

const makeApp = (
  overrides: Partial<GameSessionUseCases> & {
    getSession?: () => Promise<typeof mockSession | null>;
  } = {},
) => {
  const gameSession: GameSessionUseCases = {
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
    listMembers:
      overrides.listMembers ??
      vi.fn().mockResolvedValue({ type: 'ok', members: [] }),
    joinGameSession:
      overrides.joinGameSession ??
      vi.fn().mockResolvedValue({ type: 'ok', member: {} }),
    joinAsGuest:
      overrides.joinAsGuest ??
      vi.fn().mockResolvedValue({ type: 'ok', member: {} }),
    updateMember:
      overrides.updateMember ??
      vi.fn().mockResolvedValue({ type: 'ok', member: {} }),
    leaveGameSession:
      overrides.leaveGameSession ?? vi.fn().mockResolvedValue({ type: 'ok' }),
    getGuestLink:
      overrides.getGuestLink ??
      vi.fn().mockResolvedValue({ type: 'ok', token: 'token-abc' }),
    getGuestLinkPreview:
      overrides.getGuestLinkPreview ??
      vi.fn().mockResolvedValue({ type: 'ok', gameSession: mockGameSession }),
    getMyPlayMemo:
      overrides.getMyPlayMemo ??
      vi.fn().mockResolvedValue({ type: 'ok', playMemo: mockPlayMemo }),
    upsertMyPlayMemo:
      overrides.upsertMyPlayMemo ??
      vi.fn().mockResolvedValue({ type: 'ok', playMemo: mockPlayMemo }),
  };

  return createApp({
    frontendOrigin: 'http://localhost:5173',
    authHandler: vi.fn(async () => new Response('ok')),
    getSession: overrides.getSession ?? vi.fn().mockResolvedValue(mockSession),
    gameSession,
    profile: stubProfile,
    lobby: stubLobby,
  });
};

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
      body: JSON.stringify({ title: '新規卓', scheduledAt: FUTURE_DATE }),
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
      body: JSON.stringify({ title: '卓', scheduledAt: FUTURE_DATE }),
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
      body: JSON.stringify({ title: '', scheduledAt: FUTURE_DATE }),
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

  it('scheduledAt がなければ 400 を返す（卓は日程必須）', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/game-sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '卓' }),
    });

    // Assert
    expect(response.status).toBe(400);
  });

  it('scheduledAt が過去日なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/game-sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '卓', scheduledAt: '2000-01-01' }),
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
      body: JSON.stringify({
        title: '詳細卓',
        maxMembers: 4,
        scheduledAt: FUTURE_DATE,
      }),
    });

    // Assert
    expect(createGameSession).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        title: '詳細卓',
        maxMembers: 4,
        scheduledAt: FUTURE_DATE,
      }),
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

  it('lobbyId とメンバーの lobbyMemberId を含めて返す（募集枠経由の卓）', async () => {
    // Arrange
    const detailWithLobby = {
      ...mockGameSessionDetail,
      lobbyId: 'lobby-1',
      members: [
        {
          id: 'member-1',
          userId: 'user-2',
          userName: 'テストユーザー',
          guestName: null,
          characterName: null,
          lobbyMemberId: 'lobby-member-1',
          joinedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
    };
    const app = makeApp({
      getGameSession: vi
        .fn()
        .mockResolvedValue({ type: 'ok', gameSession: detailWithLobby }),
    });

    // Act
    const response = await app.request('/api/game-sessions/session-1');
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      lobbyId: 'lobby-1',
      members: [expect.objectContaining({ lobbyMemberId: 'lobby-member-1' })],
    });
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

  it('ホストが confirmed/today → cancelled に遷移すると 200 とセッションを返す', async () => {
    // Arrange
    const app = makeApp({
      updateGameSessionStatus: vi.fn().mockResolvedValue({
        type: 'ok',
        gameSession: { ...mockGameSession, status: 'cancelled' },
      }),
    });

    // Act
    const response = await app.request('/api/game-sessions/session-1/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: 'cancelled' });
  });

  it('cancelled への不正な遷移（draft/completed から）は 409 を返す', async () => {
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
      body: JSON.stringify({ status: 'cancelled' }),
    });

    // Assert
    expect(response.status).toBe(409);
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

describe('GET /api/game-sessions/:id/guest-link', () => {
  it('ホストが取得すると 200 とトークンを返す', async () => {
    // Arrange
    const app = makeApp({
      getGuestLink: vi
        .fn()
        .mockResolvedValue({ type: 'ok', token: 'token-abc' }),
    });

    // Act
    const response = await app.request(
      '/api/game-sessions/session-1/guest-link',
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual({ token: 'token-abc' });
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request(
      '/api/game-sessions/session-1/guest-link',
    );

    // Assert
    expect(response.status).toBe(401);
  });

  it('ホスト以外なら 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      getGuestLink: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request(
      '/api/game-sessions/session-1/guest-link',
    );

    // Assert
    expect(response.status).toBe(403);
  });

  it('セッションが存在しない場合は 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      getGuestLink: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request(
      '/api/game-sessions/nonexistent/guest-link',
    );

    // Assert
    expect(response.status).toBe(404);
  });
});

describe('GET /api/join/:token', () => {
  it('有効なトークンなら 200 とセッション情報を返す', async () => {
    // Arrange
    const app = makeApp({
      getGuestLinkPreview: vi
        .fn()
        .mockResolvedValue({ type: 'ok', gameSession: mockGameSession }),
    });

    // Act
    const response = await app.request('/api/join/valid-token');
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockGameSession);
  });

  it('無効なトークンなら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      getGuestLinkPreview: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request('/api/join/invalid-token');

    // Assert
    expect(response.status).toBe(404);
  });

  it('未認証でもアクセスできる', async () => {
    // Arrange
    const app = makeApp({
      getSession: vi.fn().mockResolvedValue(null),
      getGuestLinkPreview: vi
        .fn()
        .mockResolvedValue({ type: 'ok', gameSession: mockGameSession }),
    });

    // Act
    const response = await app.request('/api/join/valid-token');

    // Assert
    expect(response.status).toBe(200);
  });
});

// 段階6b で廃止した卓側の募集・日程調整ルート（#70）。
// ルート自体が未登録であることを保証し、うっかり復活したら気づけるようにする。
// 募集枠（lobby）側の availability-dates は現役なので対象外。
describe('廃止した卓の候補日・日程調整ルート', () => {
  const sessionId = '00000000-0000-0000-0000-000000000000';
  const dateId = '11111111-1111-1111-1111-111111111111';

  it.each([
    ['GET', `/api/game-sessions/${sessionId}/availability-dates`],
    ['POST', `/api/game-sessions/${sessionId}/availability-dates`],
    ['PUT', `/api/game-sessions/${sessionId}/availability-dates`],
    ['DELETE', `/api/game-sessions/${sessionId}/availability-dates/${dateId}`],
    [
      'POST',
      `/api/game-sessions/${sessionId}/availability-dates/${dateId}/confirm`,
    ],
    [
      'PUT',
      `/api/game-sessions/${sessionId}/availability-dates/${dateId}/responses`,
    ],
    [
      'PUT',
      `/api/game-sessions/${sessionId}/availability-dates/${dateId}/guest-responses`,
    ],
  ])('%s %s は 404 を返す', async (method, path) => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify({}),
    });

    // Assert
    expect(response.status).toBe(404);
  });
});
