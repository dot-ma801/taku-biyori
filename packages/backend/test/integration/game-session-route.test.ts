import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@/app/presentation/controller/create-app';
import type { GameSessionUseCases } from '@/game-session/application/use-cases';
import type { ProfileUseCases } from '@/profile/application/use-cases';
import type { LobbyUseCases } from '@/lobby/application/use-cases';
import type {
  GameSession,
  GameSessionListItem,
  GameSessionPlayMemo,
  Seat,
} from '@taku-biyori/shared';
import { GameSessionStatus, LobbyStatus } from '@taku-biyori/shared';

const mockSession = { user: { id: 'user-1' } };

const LOBBY_ID = '00000000-0000-4000-8000-00000000aaaa';
const SESSION_ID = '00000000-0000-4000-8000-00000000bbbb';
const SEAT_ID = '00000000-0000-4000-8000-00000000cccc';
const ENTRY_ID = '00000000-0000-4000-8000-00000000dddd';

/** モックの scheduledAt に使う十分に未来の日付 */
const FUTURE_DATE = '2999-12-31';

const base = `/api/lobbies/${LOBBY_ID}/game-sessions`;

const mockListItem: GameSessionListItem = {
  id: SESSION_ID,
  lobbyId: LOBBY_ID,
  title: 'テスト開催',
  scenarioName: null,
  status: GameSessionStatus.scheduled,
  scheduledAt: FUTURE_DATE,
  timeLabel: null,
  seats: [],
  hostUserId: 'user-1',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

const mockGameSession: GameSession = {
  id: SESSION_ID,
  lobbyId: LOBBY_ID,
  scheduledAt: FUTURE_DATE,
  status: GameSessionStatus.scheduled,
  description: null,
  overrides: {
    title: null,
    scenarioName: null,
    location: null,
    timeLabel: null,
  },
  lobby: {
    id: LOBBY_ID,
    title: 'テストロビー',
    scenarioName: null,
    location: null,
    maxPlayers: null,
    hostUserId: 'user-1',
    status: LobbyStatus.open,
  },
  completedAt: null,
  cancelledAt: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

const mockDetail = { ...mockGameSession, seats: [] };

const mockSeat: Seat = {
  id: SEAT_ID,
  entryId: ENTRY_ID,
  userId: 'user-2',
  userName: 'たくみ',
  guestName: null,
  characterName: null,
  seatedAt: '2026-08-01T00:00:00.000Z',
};

const mockPlayMemo: GameSessionPlayMemo = {
  seatId: SEAT_ID,
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
    listLobbyGameSessions:
      overrides.listLobbyGameSessions ??
      vi.fn().mockResolvedValue({ type: 'ok', gameSessions: [mockListItem] }),
    getGameSession:
      overrides.getGameSession ??
      vi.fn().mockResolvedValue({ type: 'ok', gameSession: mockDetail }),
    createGameSession:
      overrides.createGameSession ??
      vi.fn().mockResolvedValue({ type: 'ok', gameSession: mockGameSession }),
    updateGameSession:
      overrides.updateGameSession ??
      vi.fn().mockResolvedValue({ type: 'ok', gameSession: mockGameSession }),
    deleteGameSession:
      overrides.deleteGameSession ?? vi.fn().mockResolvedValue({ type: 'ok' }),
    updateGameSessionStatus:
      overrides.updateGameSessionStatus ??
      vi.fn().mockResolvedValue({ type: 'ok', gameSession: mockGameSession }),
    listSeats:
      overrides.listSeats ??
      vi.fn().mockResolvedValue({ type: 'ok', seats: [mockSeat] }),
    createSeat:
      overrides.createSeat ??
      vi.fn().mockResolvedValue({ type: 'ok', seat: mockSeat }),
    updateCharacterAssignment:
      overrides.updateCharacterAssignment ??
      vi.fn().mockResolvedValue({ type: 'ok', seat: mockSeat }),
    deleteSeat:
      overrides.deleteSeat ?? vi.fn().mockResolvedValue({ type: 'ok' }),
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
      vi.fn().mockResolvedValue({ type: 'ok', playMemos: [] }),
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

const noAuth = { getSession: vi.fn().mockResolvedValue(null) };

describe('GET /api/me/game-sessions', () => {
  it('認証済みなら 200 で横断一覧を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/me/game-sessions');
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual([mockListItem]);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp(noAuth);

    // Act
    const response = await app.request('/api/me/game-sessions');

    // Assert
    expect(response.status).toBe(401);
  });

  it('v0.2 のトップレベルのパスは残っていない', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/game-sessions');

    // Assert
    expect(response.status).toBe(404);
  });
});

describe('GET /api/lobbies/:lobbyId/game-sessions', () => {
  it('未ログインでも 200 を返す（公開ロビーの一覧）', async () => {
    // Arrange
    const app = makeApp(noAuth);

    // Act
    const response = await app.request(base);

    // Assert
    expect(response.status).toBe(200);
  });

  it('lobbyId と userId をユースケースへ渡す', async () => {
    // Arrange
    const listLobbyGameSessions = vi
      .fn()
      .mockResolvedValue({ type: 'ok', gameSessions: [] });
    const app = makeApp({ listLobbyGameSessions });

    // Act
    await app.request(base);

    // Assert
    expect(listLobbyGameSessions).toHaveBeenCalledWith(LOBBY_ID, 'user-1');
  });

  it('forbidden は未ログインなら 401、ログイン済みなら 403 を返す', async () => {
    // Arrange
    const forbidden = vi.fn().mockResolvedValue({ type: 'forbidden' });

    // Act
    const anonymous = await makeApp({
      ...noAuth,
      listLobbyGameSessions: forbidden,
    }).request(base);
    const loggedIn = await makeApp({
      listLobbyGameSessions: forbidden,
    }).request(base);

    // Assert
    expect(anonymous.status).toBe(401);
    expect(loggedIn.status).toBe(403);
  });
});

describe('POST /api/lobbies/:lobbyId/game-sessions', () => {
  const body = { scheduledAt: FUTURE_DATE, entryIds: [ENTRY_ID] };

  const post = (app: ReturnType<typeof makeApp>, payload: unknown = body) =>
    app.request(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

  it('作成に成功すると 201 でセッションを返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await post(app);

    // Assert
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(mockGameSession);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp(noAuth);

    // Act / Assert
    expect((await post(app)).status).toBe(401);
  });

  it('entryIds が空なら 400 を返す（zod で弾く）', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await post(app, {
      scheduledAt: FUTURE_DATE,
      entryIds: [],
    });

    // Assert
    expect(response.status).toBe(400);
  });

  it('ホストでなければ 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      createGameSession: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act / Assert
    expect((await post(app)).status).toBe(403);
  });

  it('解散したロビーなら 422 を返す', async () => {
    // Arrange
    const app = makeApp({
      createGameSession: vi.fn().mockResolvedValue({ type: 'invalidStatus' }),
    });

    // Act / Assert
    expect((await post(app)).status).toBe(422);
  });

  it('entryIds が不正なら 422 を返す', async () => {
    // Arrange
    // 別ロビーの entry・脱退済みの entry はどちらもここに落ちる（design-v2 §5-2）
    const app = makeApp({
      createGameSession: vi.fn().mockResolvedValue({ type: 'invalidEntries' }),
    });

    // Act / Assert
    expect((await post(app)).status).toBe(422);
  });
});

describe('GET /api/lobbies/:lobbyId/game-sessions/:id', () => {
  it('未ログインでも 200 を返す', async () => {
    // Arrange
    const app = makeApp(noAuth);

    // Act
    const response = await app.request(`${base}/${SESSION_ID}`);

    // Assert
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(mockDetail);
  });

  it('lobbyId・id・userId をユースケースへ渡す', async () => {
    // Arrange
    const getGameSession = vi
      .fn()
      .mockResolvedValue({ type: 'ok', gameSession: mockDetail });
    const app = makeApp({ getGameSession });

    // Act
    await app.request(`${base}/${SESSION_ID}`);

    // Assert
    expect(getGameSession).toHaveBeenCalledWith(LOBBY_ID, SESSION_ID, 'user-1');
  });

  it('notFound なら 404 を返す', async () => {
    // Arrange
    // URL の lobbyId が実際の所属と違うケースもここに落ちる（design-v2 §6-5）
    const app = makeApp({
      getGameSession: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act / Assert
    expect((await app.request(`${base}/${SESSION_ID}`)).status).toBe(404);
  });
});

describe('PATCH /api/lobbies/:lobbyId/game-sessions/:id', () => {
  const patch = (app: ReturnType<typeof makeApp>, payload: unknown) =>
    app.request(`${base}/${SESSION_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

  it('上書きの解除（null）をそのままユースケースへ渡す', async () => {
    // Arrange
    const updateGameSession = vi
      .fn()
      .mockResolvedValue({ type: 'ok', gameSession: mockGameSession });
    const app = makeApp({ updateGameSession });

    // Act
    const response = await patch(app, { title: null });

    // Assert
    expect(response.status).toBe(200);
    expect(updateGameSession).toHaveBeenCalledWith(
      LOBBY_ID,
      SESSION_ID,
      'user-1',
      { title: null },
    );
  });

  it('中止した開催なら 422 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateGameSession: vi.fn().mockResolvedValue({ type: 'invalidStatus' }),
    });

    // Act / Assert
    expect((await patch(app, { title: 'x' })).status).toBe(422);
  });

  it('募集系のフィールドは受け付けない（400）', async () => {
    // Arrange
    const app = makeApp();

    // Act / Assert
    expect((await patch(app, { maxMembers: 6 })).status).toBe(400);
  });
});

describe('DELETE /api/lobbies/:lobbyId/game-sessions/:id', () => {
  const del = (app: ReturnType<typeof makeApp>) =>
    app.request(`${base}/${SESSION_ID}`, { method: 'DELETE' });

  it('削除に成功すると 204 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act / Assert
    expect((await del(app)).status).toBe(204);
  });

  it('他の着席者がいれば 409 を返す', async () => {
    // Arrange
    const app = makeApp({
      deleteGameSession: vi.fn().mockResolvedValue({ type: 'hasSeat' }),
    });

    // Act / Assert
    expect((await del(app)).status).toBe(409);
  });
});

describe('PATCH /api/lobbies/:lobbyId/game-sessions/:id/status', () => {
  const patchStatus = (app: ReturnType<typeof makeApp>, payload: unknown) =>
    app.request(`${base}/${SESSION_ID}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

  it.each(['completed', 'cancelled'])(
    '%s への遷移を受け付ける',
    async (status) => {
      // Arrange
      const app = makeApp();

      // Act / Assert
      expect((await patchStatus(app, { status })).status).toBe(200);
    },
  );

  it('open は受け付けない（400）', async () => {
    // Arrange
    // セッションから公開の概念が消えたため（design-v2 §6-13-6）
    const app = makeApp();

    // Act / Assert
    expect((await patchStatus(app, { status: 'open' })).status).toBe(400);
  });

  it('すでに終端なら 422 を返す', async () => {
    // Arrange
    // v0.2 は 409 だったが、状態が理由で処理できないものは 422 に寄せた（design-v2 §6-10）
    const app = makeApp({
      updateGameSessionStatus: vi
        .fn()
        .mockResolvedValue({ type: 'invalidTransition' }),
    });

    // Act / Assert
    expect((await patchStatus(app, { status: 'completed' })).status).toBe(422);
  });
});

describe('着席のルート', () => {
  const seatsPath = `${base}/${SESSION_ID}/seats`;

  it('GET は未ログインでも 200 を返す', async () => {
    // Arrange
    const app = makeApp(noAuth);

    // Act
    const response = await app.request(seatsPath);

    // Assert
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([mockSeat]);
  });

  it('POST は entryId を必須にする（body 無しは 400）', async () => {
    // Arrange
    // 自分で着席する経路は廃止した（design-v2 §6-6）
    const app = makeApp();

    // Act
    const response = await app.request(seatsPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    // Assert
    expect(response.status).toBe(400);
  });

  it('POST が成功すると 201 で Seat を返す', async () => {
    // Arrange
    const createSeat = vi
      .fn()
      .mockResolvedValue({ type: 'ok', seat: mockSeat });
    const app = makeApp({ createSeat });

    // Act
    const response = await app.request(seatsPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId: ENTRY_ID }),
    });

    // Assert
    expect(response.status).toBe(201);
    expect(createSeat).toHaveBeenCalledWith(LOBBY_ID, SESSION_ID, 'user-1', {
      entryId: ENTRY_ID,
    });
  });

  it('POST でロビーが違う entry を渡すと 422 を返す', async () => {
    // Arrange
    const app = makeApp({
      createSeat: vi.fn().mockResolvedValue({ type: 'invalidEntry' }),
    });

    // Act
    const response = await app.request(seatsPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId: ENTRY_ID }),
    });

    // Assert
    expect(response.status).toBe(422);
  });

  it('POST ですでに着席済みなら 409 を返す', async () => {
    // Arrange
    const app = makeApp({
      createSeat: vi.fn().mockResolvedValue({ type: 'alreadySeated' }),
    });

    // Act
    const response = await app.request(seatsPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId: ENTRY_ID }),
    });

    // Assert
    expect(response.status).toBe(409);
  });

  it('PUT は characterName の省略を許さない（400）', async () => {
    // Arrange
    // キーの有無で「変更しない」と「解除」を区別させないため required にしている
    const app = makeApp();

    // Act
    const response = await app.request(`${seatsPath}/${SEAT_ID}/character`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    // Assert
    expect(response.status).toBe(400);
  });

  it('DELETE でキャラクター割り当てを解除する', async () => {
    // Arrange
    const updateCharacterAssignment = vi
      .fn()
      .mockResolvedValue({ type: 'ok', seat: mockSeat });
    const app = makeApp({ updateCharacterAssignment });

    // Act
    const response = await app.request(`${seatsPath}/${SEAT_ID}/character`, {
      method: 'DELETE',
    });

    // Assert
    expect(response.status).toBe(200);
    expect(updateCharacterAssignment).toHaveBeenCalledWith(
      SESSION_ID,
      SEAT_ID,
      'user-1',
      null,
    );
  });

  it('DELETE が成功すると 204 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(`${seatsPath}/${SEAT_ID}`, {
      method: 'DELETE',
    });

    // Assert
    expect(response.status).toBe(204);
  });

  it('DELETE で終端の開催なら 422 を返す', async () => {
    // Arrange
    const app = makeApp({
      deleteSeat: vi.fn().mockResolvedValue({ type: 'invalidStatus' }),
    });

    // Act
    const response = await app.request(`${seatsPath}/${SEAT_ID}`, {
      method: 'DELETE',
    });

    // Assert
    expect(response.status).toBe(422);
  });

  it('v0.2 の members / guest-seats のパスは残っていない', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const members = await app.request(
      `/api/game-sessions/${SESSION_ID}/members`,
    );
    const guestSeats = await app.request(`${seatsPath}/../guest-seats`);

    // Assert
    expect(members.status).toBe(404);
    expect(guestSeats.status).toBe(404);
  });
});
