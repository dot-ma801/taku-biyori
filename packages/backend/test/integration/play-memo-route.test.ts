import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@/app/presentation/controller/create-app';
import type { GameSessionUseCases } from '@/game-session/application/use-cases';
import type { ProfileUseCases } from '@/profile/application/use-cases';
import type { LobbyUseCases } from '@/lobby/application/use-cases';
import type {
  GameSessionPlayMemo,
  MyGameSessionPlayMemo,
} from '@taku-biyori/shared';

const mockSession = { user: { id: 'user-1' } };

const mockPlayMemo: GameSessionPlayMemo = {
  memberId: '00000000-0000-4000-8000-000000000001',
  body: '今日のセッションのメモ',
  sharedAt: null,
  updatedAt: '2026-08-02T00:00:00.000Z',
};

/** メモ未作成のメンバーに返す空メモ（design-v1.2 §8） */
const emptyPlayMemo: MyGameSessionPlayMemo = {
  memberId: '00000000-0000-4000-8000-000000000001',
  body: '',
  sharedAt: null,
  updatedAt: null,
};

const stubProfile = {} as unknown as ProfileUseCases;
const stubLobby = {} as unknown as LobbyUseCases;

const makeApp = (
  overrides: Partial<
    Pick<GameSessionUseCases, 'getMyPlayMemo' | 'upsertMyPlayMemo'>
  > & {
    getSession?: () => Promise<typeof mockSession | null>;
  } = {},
) => {
  const gameSession = {
    getMyPlayMemo:
      overrides.getMyPlayMemo ??
      vi.fn().mockResolvedValue({ type: 'ok', playMemo: mockPlayMemo }),
    upsertMyPlayMemo:
      overrides.upsertMyPlayMemo ??
      vi.fn().mockResolvedValue({ type: 'ok', playMemo: mockPlayMemo }),
  } as unknown as GameSessionUseCases;

  return createApp({
    frontendOrigin: 'http://localhost:5173',
    authHandler: vi.fn(async () => new Response('ok')),
    getSession: overrides.getSession ?? vi.fn().mockResolvedValue(mockSession),
    gameSession,
    profile: stubProfile,
    lobby: stubLobby,
  });
};

describe('GET /api/game-sessions/:id/play-memos/me', () => {
  it('メンバーなら 200 で自分のメモを返す', async () => {
    // Arrange
    const getMyPlayMemo = vi
      .fn()
      .mockResolvedValue({ type: 'ok', playMemo: mockPlayMemo });
    const app = makeApp({ getMyPlayMemo });

    // Act
    const response = await app.request(
      '/api/game-sessions/session-1/play-memos/me',
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockPlayMemo);
    expect(getMyPlayMemo).toHaveBeenCalledWith('session-1', 'user-1');
  });

  // 未作成と取得エラーをフロントで分岐させない（design-v1.2 §8）
  it('メモ未作成でも 404 にせず空メモを返す', async () => {
    // Arrange
    const app = makeApp({
      getMyPlayMemo: vi
        .fn()
        .mockResolvedValue({ type: 'ok', playMemo: emptyPlayMemo }),
    });

    // Act
    const response = await app.request(
      '/api/game-sessions/session-1/play-memos/me',
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(emptyPlayMemo);
  });

  it('未ログインなら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request(
      '/api/game-sessions/session-1/play-memos/me',
    );

    // Assert
    expect(response.status).toBe(401);
  });

  it('卓が存在しないなら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      getMyPlayMemo: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request(
      '/api/game-sessions/nonexistent/play-memos/me',
    );

    // Assert
    expect(response.status).toBe(404);
  });

  // ゲスト参加のみのユーザーもここに落ちる（ゲストは user_id = null のため
  // メンバー検索に構造上ヒットしない。design-v1.2 §4）
  it('その卓のメンバーでないなら 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      getMyPlayMemo: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request(
      '/api/game-sessions/session-1/play-memos/me',
    );

    // Assert
    expect(response.status).toBe(403);
  });
});

describe('PUT /api/game-sessions/:id/play-memos/me', () => {
  const put = (
    app: ReturnType<typeof makeApp>,
    body: unknown,
    id = 'session-1',
  ) =>
    app.request(`/api/game-sessions/${id}/play-memos/me`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('メンバーなら 200 で保存後のメモを返す', async () => {
    // Arrange
    const upsertMyPlayMemo = vi
      .fn()
      .mockResolvedValue({ type: 'ok', playMemo: mockPlayMemo });
    const app = makeApp({ upsertMyPlayMemo });

    // Act
    const response = await put(app, { body: '今日のセッションのメモ' });
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(responseBody).toEqual(mockPlayMemo);
    expect(upsertMyPlayMemo).toHaveBeenCalledWith('session-1', 'user-1', {
      body: '今日のセッションのメモ',
    });
  });

  // 本文を空にしても行は残す（design-v1.2 §8）
  it('空文字の本文を受け付ける', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await put(app, { body: '' });

    // Assert
    expect(response.status).toBe(200);
  });

  it('未ログインなら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await put(app, { body: 'メモ' });

    // Assert
    expect(response.status).toBe(401);
  });

  it('未ログインならユースケースを呼ばない', async () => {
    // Arrange
    const upsertMyPlayMemo = vi.fn();
    const app = makeApp({
      upsertMyPlayMemo,
      getSession: vi.fn().mockResolvedValue(null),
    });

    // Act
    await put(app, { body: 'メモ' });

    // Assert
    expect(upsertMyPlayMemo).not.toHaveBeenCalled();
  });

  it('卓が存在しないなら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      upsertMyPlayMemo: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await put(app, { body: 'メモ' }, 'nonexistent');

    // Assert
    expect(response.status).toBe(404);
  });

  it('その卓のメンバーでないなら 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      upsertMyPlayMemo: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await put(app, { body: 'メモ' });

    // Assert
    expect(response.status).toBe(403);
  });

  // 確定後ロックは 409 に統一する（423 は使わない。design-v1.2 §8）
  it('完了・中止した卓なら 409 を返す', async () => {
    // Arrange
    const app = makeApp({
      upsertMyPlayMemo: vi.fn().mockResolvedValue({ type: 'statusLocked' }),
    });

    // Act
    const response = await put(app, { body: 'メモ' });

    // Assert
    expect(response.status).toBe(409);
  });

  it('本文が 5000 文字を超えると 400 を返す', async () => {
    // Arrange
    const upsertMyPlayMemo = vi.fn();
    const app = makeApp({ upsertMyPlayMemo });

    // Act
    const response = await put(app, { body: 'あ'.repeat(5001) });

    // Assert
    expect(response.status).toBe(400);
    expect(upsertMyPlayMemo).not.toHaveBeenCalled();
  });

  it('body が無いと 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await put(app, {});

    // Assert
    expect(response.status).toBe(400);
  });

  it('不正な JSON なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/game-sessions/session-1/play-memos/me',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: 'not json',
      },
    );

    // Assert
    expect(response.status).toBe(400);
  });
});
