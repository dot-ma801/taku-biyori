import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@/app/presentation/controller/create-app';
import type { GameSessionUseCases } from '@/game-session/application/use-cases';
import type { ProfileUseCases } from '@/profile/application/use-cases';
import type { LobbyUseCases } from '@/lobby/application/use-cases';
import type {
  GameSessionPlayMemo,
  MyGameSessionPlayMemo,
  SharedGameSessionPlayMemo,
} from '@taku-biyori/shared';

const mockSession = { user: { id: 'user-1' } };

const LOBBY_ID = '00000000-0000-4000-8000-00000000aaaa';
/** 開催はロビー配下に入れ子（design-v2 §6-13） */
const base = `/api/lobbies/${LOBBY_ID}/game-sessions`;

const mockPlayMemo: GameSessionPlayMemo = {
  seatId: '00000000-0000-4000-8000-000000000001',
  body: '今日のセッションのメモ',
  sharedAt: null,
  updatedAt: '2026-08-02T00:00:00.000Z',
};

/** メモ未作成のメンバーに返す空メモ（design-v1.2 §8） */
const emptyPlayMemo: MyGameSessionPlayMemo = {
  seatId: '00000000-0000-4000-8000-000000000001',
  body: '',
  sharedAt: null,
  updatedAt: null,
};

const sharedPlayMemos: SharedGameSessionPlayMemo[] = [
  {
    seatId: '00000000-0000-4000-8000-000000000001',
    body: '一人目のメモ',
    sharedAt: '2026-08-02T10:00:00.000Z',
    updatedAt: '2026-08-02T10:00:00.000Z',
  },
  {
    seatId: '00000000-0000-4000-8000-000000000002',
    body: '二人目のメモ',
    sharedAt: '2026-08-02T11:00:00.000Z',
    updatedAt: '2026-08-02T11:00:00.000Z',
  },
];

const stubProfile = {} as unknown as ProfileUseCases;
const stubLobby = {} as unknown as LobbyUseCases;

const makeApp = (
  overrides: Partial<
    Pick<
      GameSessionUseCases,
      | 'getMyPlayMemo'
      | 'upsertMyPlayMemo'
      | 'updateMyPlayMemoVisibility'
      | 'listSharedPlayMemos'
    >
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
    updateMyPlayMemoVisibility:
      overrides.updateMyPlayMemoVisibility ??
      vi.fn().mockResolvedValue({ type: 'ok', playMemo: mockPlayMemo }),
    listSharedPlayMemos:
      overrides.listSharedPlayMemos ??
      vi.fn().mockResolvedValue({ type: 'ok', playMemos: sharedPlayMemos }),
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

describe('GET /api/lobbies/:lobbyId/game-sessions/:id/play-memos/me', () => {
  it('メンバーなら 200 で自分のメモを返す', async () => {
    // Arrange
    const getMyPlayMemo = vi
      .fn()
      .mockResolvedValue({ type: 'ok', playMemo: mockPlayMemo });
    const app = makeApp({ getMyPlayMemo });

    // Act
    const response = await app.request(`${base}/session-1/play-memos/me`);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockPlayMemo);
    expect(getMyPlayMemo).toHaveBeenCalledWith(LOBBY_ID, 'session-1', 'user-1');
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
    const response = await app.request(`${base}/session-1/play-memos/me`);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(emptyPlayMemo);
  });

  it('未ログインなら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request(`${base}/session-1/play-memos/me`);

    // Assert
    expect(response.status).toBe(401);
  });

  it('卓が存在しないなら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      getMyPlayMemo: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request(`${base}/nonexistent/play-memos/me`);

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
    const response = await app.request(`${base}/session-1/play-memos/me`);

    // Assert
    expect(response.status).toBe(403);
  });
});

describe('PUT /api/lobbies/:lobbyId/game-sessions/:id/play-memos/me', () => {
  const put = (
    app: ReturnType<typeof makeApp>,
    body: unknown,
    id = 'session-1',
  ) =>
    app.request(`${base}/${id}/play-memos/me`, {
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
    expect(upsertMyPlayMemo).toHaveBeenCalledWith(
      LOBBY_ID,
      'session-1',
      'user-1',
      {
        body: '今日のセッションのメモ',
      },
    );
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

  it('本文が 5000 文字ちょうどなら受け付ける', async () => {
    // Arrange
    const upsertMyPlayMemo = vi
      .fn()
      .mockResolvedValue({ type: 'ok', playMemo: mockPlayMemo });
    const app = makeApp({ upsertMyPlayMemo });
    const body = 'あ'.repeat(5000);

    // Act
    const response = await put(app, { body });

    // Assert
    expect(response.status).toBe(200);
    expect(upsertMyPlayMemo).toHaveBeenCalledWith(
      LOBBY_ID,
      'session-1',
      'user-1',
      {
        body,
      },
    );
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
    const response = await app.request(`${base}/session-1/play-memos/me`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: 'not json',
    });

    // Assert
    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/lobbies/:lobbyId/game-sessions/:id/play-memos/me/visibility', () => {
  const patch = (
    app: ReturnType<typeof makeApp>,
    body: unknown,
    id = 'session-1',
  ) =>
    app.request(`${base}/${id}/play-memos/me/visibility`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('メンバーなら 200 で切替後のメモを返す', async () => {
    // Arrange
    const updateMyPlayMemoVisibility = vi
      .fn()
      .mockResolvedValue({ type: 'ok', playMemo: mockPlayMemo });
    const app = makeApp({ updateMyPlayMemoVisibility });

    // Act
    const response = await patch(app, { shared: true });
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(responseBody).toEqual(mockPlayMemo);
    expect(updateMyPlayMemoVisibility).toHaveBeenCalledWith(
      LOBBY_ID,
      'session-1',
      'user-1',
      { shared: true },
    );
  });

  // 公開を取りやめて非公開に戻せる（要求 §3-2）
  it('非公開に戻す指定を受け付ける', async () => {
    // Arrange
    const updateMyPlayMemoVisibility = vi
      .fn()
      .mockResolvedValue({ type: 'ok', playMemo: mockPlayMemo });
    const app = makeApp({ updateMyPlayMemoVisibility });

    // Act
    const response = await patch(app, { shared: false });

    // Assert
    expect(response.status).toBe(200);
    expect(updateMyPlayMemoVisibility).toHaveBeenCalledWith(
      LOBBY_ID,
      'session-1',
      'user-1',
      { shared: false },
    );
  });

  it('未ログインなら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await patch(app, { shared: true });

    // Assert
    expect(response.status).toBe(401);
  });

  it('未ログインならユースケースを呼ばない', async () => {
    // Arrange
    const updateMyPlayMemoVisibility = vi.fn();
    const app = makeApp({
      updateMyPlayMemoVisibility,
      getSession: vi.fn().mockResolvedValue(null),
    });

    // Act
    await patch(app, { shared: true });

    // Assert
    expect(updateMyPlayMemoVisibility).not.toHaveBeenCalled();
  });

  // ユースケースは「卓が無い」場合と「メモ未作成」の場合の両方で notFound を返すため、
  // HTTP 層ではどちらも同じ 404 に落ちる（design-v1.2 §5）。両者の区別は application 層の責務で、
  // メモ未作成 → notFound の実質的な検証はユニットテスト
  // （update-my-play-memo-visibility.test.ts の「メモ未作成なら notFound を返す」）が担っている
  it('卓が存在しないなら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateMyPlayMemoVisibility: vi
        .fn()
        .mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await patch(app, { shared: true }, 'nonexistent');

    // Assert
    expect(response.status).toBe(404);
  });

  it('その卓のメンバーでないなら 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateMyPlayMemoVisibility: vi
        .fn()
        .mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await patch(app, { shared: true });

    // Assert
    expect(response.status).toBe(403);
  });

  it('shared が無いと 400 を返す', async () => {
    // Arrange
    const updateMyPlayMemoVisibility = vi.fn();
    const app = makeApp({ updateMyPlayMemoVisibility });

    // Act
    const response = await patch(app, {});

    // Assert
    expect(response.status).toBe(400);
    expect(updateMyPlayMemoVisibility).not.toHaveBeenCalled();
  });

  // 文字列の 'true' を真として通すと、誤って公開する事故につながる
  it('真偽値でない shared なら 400 を返す', async () => {
    // Arrange
    const updateMyPlayMemoVisibility = vi.fn();
    const app = makeApp({ updateMyPlayMemoVisibility });

    // Act
    const response = await patch(app, { shared: 'true' });

    // Assert
    expect(response.status).toBe(400);
    expect(updateMyPlayMemoVisibility).not.toHaveBeenCalled();
  });

  it('不正な JSON なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      `${base}/session-1/play-memos/me/visibility`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: 'not json',
      },
    );

    // Assert
    expect(response.status).toBe(400);
  });
});

describe('GET /api/lobbies/:lobbyId/game-sessions/:id/play-memos', () => {
  it('完了した卓の公開メモ一覧を 200 で返す', async () => {
    // Arrange
    const listSharedPlayMemos = vi
      .fn()
      .mockResolvedValue({ type: 'ok', playMemos: sharedPlayMemos });
    const app = makeApp({ listSharedPlayMemos });

    // Act
    const response = await app.request(`${base}/session-1/play-memos`);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(sharedPlayMemos);
    expect(listSharedPlayMemos).toHaveBeenCalledWith(
      LOBBY_ID,
      'session-1',
      'user-1',
    );
  });

  // 未ログイン・ゲストでも公開メモは読める（要求 §3-4・design-v1.2 §4）
  it('未ログインでも 200 で公開メモ一覧を返す', async () => {
    // Arrange
    const listSharedPlayMemos = vi
      .fn()
      .mockResolvedValue({ type: 'ok', playMemos: sharedPlayMemos });
    const app = makeApp({
      listSharedPlayMemos,
      getSession: vi.fn().mockResolvedValue(null),
    });

    // Act
    const response = await app.request(`${base}/session-1/play-memos`);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(sharedPlayMemos);
    expect(listSharedPlayMemos).toHaveBeenCalledWith(
      LOBBY_ID,
      'session-1',
      null,
    );
  });

  // 完了・中止前は他人のメモを見せない（要求 §3-3）
  it('完了前の卓では空配列を返す', async () => {
    // Arrange
    const app = makeApp({
      listSharedPlayMemos: vi
        .fn()
        .mockResolvedValue({ type: 'ok', playMemos: [] }),
    });

    // Act
    const response = await app.request(`${base}/session-1/play-memos`);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });

  it('卓が存在しないなら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      listSharedPlayMemos: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request(`${base}/nonexistent/play-memos`);

    // Assert
    expect(response.status).toBe(404);
  });

  // 非公開のまま中止された卓のメモが第三者に漏れないことの要（design-v1.2 §4 手順2）
  it('非公開の卓をホスト以外が呼ぶと 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      listSharedPlayMemos: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request(`${base}/session-1/play-memos`);

    // Assert
    expect(response.status).toBe(403);
  });

  it('非公開の卓を未ログインで呼んでも 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      listSharedPlayMemos: vi.fn().mockResolvedValue({ type: 'forbidden' }),
      getSession: vi.fn().mockResolvedValue(null),
    });

    // Act
    const response = await app.request(`${base}/session-1/play-memos`);

    // Assert
    expect(response.status).toBe(403);
  });
});
