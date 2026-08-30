import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@/app/presentation/controller/create-app';
import type { GameSessionUseCases } from '@/game-session/application/use-cases';
import type { ProfileUseCases } from '@/profile/application/use-cases';
import type { LobbyUseCases } from '@/lobby/application/use-cases';
import type {
  Lobby,
  LobbyDetail,
  LobbyListItem,
  LobbyEntry,
  LobbySchedulePoll,
  LobbySchedulePollSummary,
  LobbyCandidateDate,
  LobbyScheduleAnswer,
  CreateSchedulePollInput,
  GuestUpsertScheduleAnswersInput,
  CreateLobbyInput,
  UpdateLobbyStatusInput,
} from '@taku-biyori/shared';
import { GUEST_TOKEN_HEADER, LobbyStatus } from '@taku-biyori/shared';
import type { GetLobbyResult } from '@/lobby/application/get-lobby';
import type { ListEntriesResult } from '@/lobby/application/list-entries';
import type { JoinLobbyResult } from '@/lobby/application/join-lobby';
import type { JoinAsGuestResult } from '@/lobby/application/join-as-guest';
import type { LeaveLobbyResult } from '@/lobby/application/leave-lobby';
import type { GetGuestLinkResult } from '@/lobby/application/get-guest-link';
import type { ListSchedulePollsResult } from '@/lobby/application/list-schedule-polls';
import type { CreateSchedulePollResult } from '@/lobby/application/create-schedule-poll';
import type { UpsertGuestScheduleAnswersResult } from '@/lobby/application/upsert-guest-schedule-answers';
import type { UpdateLobbyStatusResult } from '@/lobby/application/update-lobby-status';

const mockSession = { user: { id: 'user-1' } };

const mockMember: LobbyEntry = {
  id: 'member-1',
  userId: 'user-2',
  userName: 'テストユーザー',
  guestName: null,
  joinedAt: '2025-01-01T00:00:00.000Z',
  leftAt: null,
};

const mockGuestMember: LobbyEntry = {
  id: 'member-2',
  userId: null,
  userName: null,
  guestName: 'ゲスト太郎',
  joinedAt: '2025-01-01T00:00:00.000Z',
  leftAt: null,
};

const mockListItem: LobbyListItem = {
  id: 'f2b4dbb8-0000-4000-8000-000000000001',
  title: 'テスト募集',
  status: LobbyStatus.draft,
  publishedAt: null,
  receptionClosedAt: null,
  entries: [],
  hostUserId: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockLobby: Lobby = {
  id: 'f2b4dbb8-0000-4000-8000-000000000001',
  title: '新規募集',
  status: LobbyStatus.draft,
  publishedAt: null,
  receptionClosedAt: null,
  disbandedAt: null,
  hostUserId: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockLobbyDetail: LobbyDetail = {
  ...mockLobby,
  entries: [],
  schedulePolls: [],
};

const mockGetOk: GetLobbyResult = {
  type: 'ok',
  lobby: mockLobbyDetail,
};

const mockCandidateDate: LobbyCandidateDate = {
  id: 'date-1',
  date: '2099-09-01',
  timeLabel: null,
};

const mockScheduleAnswer: LobbyScheduleAnswer = {
  id: 'answer-1',
  entryId: 'member-1',
  answer: 'ok',
  comment: null,
};

const mockSchedulePollSummary: LobbySchedulePollSummary = {
  id: 'poll-1',
  createdAt: '2025-01-01T00:00:00.000Z',
};

const mockSchedulePoll: LobbySchedulePoll = {
  id: 'poll-1',
  lobbyId: 'lobby-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  candidateDates: [{ ...mockCandidateDate, answers: [mockScheduleAnswer] }],
};

const stubProfile = {} as unknown as ProfileUseCases;
const stubGameSession = {} as unknown as GameSessionUseCases;

const makeApp = (
  overrides: Partial<LobbyUseCases> & {
    getSession?: () => Promise<typeof mockSession | null>;
  } = {},
) => {
  const lobby: LobbyUseCases = {
    listLobbies:
      overrides.listLobbies ?? vi.fn().mockResolvedValue([mockListItem]),
    createLobby: overrides.createLobby ?? vi.fn().mockResolvedValue(mockLobby),
    getLobby: overrides.getLobby ?? vi.fn().mockResolvedValue(mockGetOk),
    updateLobby:
      overrides.updateLobby ??
      vi.fn().mockResolvedValue({ type: 'ok', lobby: mockLobby }),
    deleteLobby:
      overrides.deleteLobby ?? vi.fn().mockResolvedValue({ type: 'ok' }),
    updateLobbyStatus:
      overrides.updateLobbyStatus ??
      vi.fn().mockResolvedValue({ type: 'ok', lobby: mockLobby }),
    listEntries:
      overrides.listEntries ??
      vi.fn().mockResolvedValue({ type: 'ok', entries: [mockMember] }),
    joinLobby:
      overrides.joinLobby ??
      vi.fn().mockResolvedValue({ type: 'ok', entry: mockMember }),
    joinAsGuest:
      overrides.joinAsGuest ??
      vi.fn().mockResolvedValue({ type: 'ok', entry: mockGuestMember }),
    leaveLobby:
      overrides.leaveLobby ?? vi.fn().mockResolvedValue({ type: 'ok' }),
    regenerateGuestLink:
      overrides.regenerateGuestLink ??
      vi.fn().mockResolvedValue({ type: 'ok', token: 'regenerated-token' }),
    getGuestLink:
      overrides.getGuestLink ??
      vi.fn().mockResolvedValue({ type: 'ok', token: 'guest-token-abc' }),
    listSchedulePolls:
      overrides.listSchedulePolls ??
      vi
        .fn()
        .mockResolvedValue({ type: 'ok', polls: [mockSchedulePollSummary] }),
    getSchedulePoll:
      overrides.getSchedulePoll ??
      vi.fn().mockResolvedValue({ type: 'ok', poll: mockSchedulePoll }),
    createSchedulePoll:
      overrides.createSchedulePoll ??
      vi.fn().mockResolvedValue({ type: 'ok', poll: mockSchedulePoll }),
    replaceCandidateDates:
      overrides.replaceCandidateDates ??
      vi.fn().mockResolvedValue({ type: 'ok', dates: [mockCandidateDate] }),
    upsertScheduleAnswers:
      overrides.upsertScheduleAnswers ??
      vi.fn().mockResolvedValue({ type: 'ok', answers: [mockScheduleAnswer] }),
    upsertGuestScheduleAnswers:
      overrides.upsertGuestScheduleAnswers ??
      vi.fn().mockResolvedValue({ type: 'ok', answers: [mockScheduleAnswer] }),
  };

  return createApp({
    frontendOrigin: 'http://localhost:5173',
    authHandler: vi.fn(async () => new Response('ok')),
    getSession: overrides.getSession ?? vi.fn().mockResolvedValue(mockSession),
    gameSession: stubGameSession,
    profile: stubProfile,
    lobby,
  });
};

describe('GET /api/lobbies', () => {
  it('認証済みなら 200 で募集枠一覧を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies');
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual([mockListItem]);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request('/api/lobbies');

    // Assert
    expect(response.status).toBe(401);
  });

  it('userId をユースケースに渡す', async () => {
    // Arrange
    const listLobbies = vi.fn().mockResolvedValue([]);
    const app = makeApp({ listLobbies });

    // Act
    await app.request('/api/lobbies');

    // Assert
    expect(listLobbies).toHaveBeenCalledWith('user-1');
  });
});

describe('POST /api/lobbies', () => {
  it('有効なボディで 201 と募集枠を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: '新規募集',
        candidateDates: [{ date: '2099-09-01' }],
      }),
    });
    const body = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(body).toEqual(mockLobby);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request('/api/lobbies', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: '募集',
        candidateDates: [{ date: '2099-09-01' }],
      }),
    });

    // Assert
    expect(response.status).toBe(401);
  });

  it('candidateDates が空配列でも 201 を返す（v2 で任意になった）', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '募集', candidateDates: [] }),
    });

    // Assert
    expect(response.status).toBe(201);
  });

  it('candidateDates 未指定でも 201 を返す（直接卓立ての経路）', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '募集' }),
    });

    // Assert
    expect(response.status).toBe(201);
  });

  it('title が空なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: '',
        candidateDates: [{ date: '2099-09-01' }],
      }),
    });

    // Assert
    expect(response.status).toBe(400);
  });

  it('openUntil が過去日なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: '募集',
        openUntil: '2000-01-01',
        candidateDates: [{ date: '2099-09-01' }],
      }),
    });

    // Assert
    expect(response.status).toBe(400);
  });

  it('ユースケースに userId と入力を渡す', async () => {
    // Arrange
    const createLobby = vi.fn().mockResolvedValue(mockLobby);
    const app = makeApp({ createLobby });

    // Act
    await app.request('/api/lobbies', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: '詳細募集',
        maxPlayers: 4,
        candidateDates: [{ date: '2099-09-01' }, { date: '2099-09-02' }],
      }),
    });

    // Assert
    expect(createLobby).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        title: '詳細募集',
        maxPlayers: 4,
        candidateDates: [{ date: '2099-09-01' }, { date: '2099-09-02' }],
      }),
    );
  });
});

describe('GET /api/lobbies/:id', () => {
  it('認証済みなら 200 で詳細を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1');
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockLobbyDetail);
  });

  it('公開済み募集枠は未認証でも 200 を返す', async () => {
    // Arrange
    const app = makeApp({
      getSession: vi.fn().mockResolvedValue(null),
      getLobby: vi.fn().mockResolvedValue(mockGetOk),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1');

    // Assert
    expect(response.status).toBe(200);
  });

  it('存在しない募集枠なら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      getLobby: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request('/api/lobbies/nonexistent');

    // Assert
    expect(response.status).toBe(404);
  });

  it('非公開募集枠にホスト以外がアクセスすると 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      getLobby: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1');

    // Assert
    expect(response.status).toBe(403);
  });

  it('非公開募集枠に未認証でアクセスすると 401 を返す', async () => {
    // Arrange
    const app = makeApp({
      getSession: vi.fn().mockResolvedValue(null),
      getLobby: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1');

    // Assert
    expect(response.status).toBe(401);
  });

  it('userId を getLobby に渡す', async () => {
    // Arrange
    const getLobby = vi.fn().mockResolvedValue(mockGetOk);
    const app = makeApp({ getLobby });

    // Act
    await app.request('/api/lobbies/lobby-1');

    // Assert
    expect(getLobby).toHaveBeenCalledWith('lobby-1', 'user-1');
  });
});

describe('PATCH /api/lobbies/:id', () => {
  it('ホストが更新すると 200 と募集枠を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '更新後' }),
    });
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockLobby);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request('/api/lobbies/lobby-1', {
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
      updateLobby: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '更新後' }),
    });

    // Assert
    expect(response.status).toBe(403);
  });

  it('存在しない募集枠なら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateLobby: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '更新後' }),
    });

    // Assert
    expect(response.status).toBe(404);
  });

  it('cancelled の募集枠は 409 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateLobby: vi.fn().mockResolvedValue({ type: 'invalidStatus' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '更新後' }),
    });

    // Assert
    expect(response.status).toBe(409);
  });

  it('空ボディなら 400 を返す（最低1フィールド必要）', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    // Assert
    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/lobbies/:id', () => {
  it('ホストが削除すると 204 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1', {
      method: 'DELETE',
    });

    // Assert
    expect(response.status).toBe(204);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request('/api/lobbies/lobby-1', {
      method: 'DELETE',
    });

    // Assert
    expect(response.status).toBe(401);
  });

  it('ホストでない場合は 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      deleteLobby: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1', {
      method: 'DELETE',
    });

    // Assert
    expect(response.status).toBe(403);
  });

  it('存在しない募集枠なら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      deleteLobby: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request('/api/lobbies/nonexistent', {
      method: 'DELETE',
    });

    // Assert
    expect(response.status).toBe(404);
  });

  it('ホスト以外のメンバーがいる募集枠は 409 を返す', async () => {
    // Arrange
    const app = makeApp({
      deleteLobby: vi.fn().mockResolvedValue({ type: 'hasMember' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1', {
      method: 'DELETE',
    });

    // Assert
    expect(response.status).toBe(409);
  });
});

describe('PATCH /api/lobbies/:id/status', () => {
  it('ホストが draft → open に遷移すると 200 と募集枠を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    });
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockLobby);
  });

  it('ホストが disbanded に遷移すると 200 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'disbanded' }),
    });

    // Assert
    expect(response.status).toBe(200);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/status', {
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
      updateLobbyStatus: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    });

    // Assert
    expect(response.status).toBe(403);
  });

  it('存在しない募集枠なら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateLobbyStatus: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request('/api/lobbies/nonexistent/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    });

    // Assert
    expect(response.status).toBe(404);
  });

  it('不正な遷移なら 422 を返す（状態が操作を許さない）', async () => {
    // Arrange
    const app = makeApp({
      updateLobbyStatus: vi
        .fn()
        .mockResolvedValue({ type: 'invalidTransition' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'disbanded' }),
    });

    // Assert
    expect(response.status).toBe(422);
  });

  it('不正な status 値なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'scheduling' }),
    });

    // Assert
    expect(response.status).toBe(400);
  });

  it('ユースケースに id と userId と input を渡す', async () => {
    // Arrange
    const updateLobbyStatus = vi
      .fn()
      .mockResolvedValue({ type: 'ok', lobby: mockLobby });
    const app = makeApp({ updateLobbyStatus });

    // Act
    await app.request('/api/lobbies/lobby-1/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    });

    // Assert
    expect(updateLobbyStatus).toHaveBeenCalledWith('lobby-1', 'user-1', {
      status: 'open',
    });
  });
});

describe('GET /api/lobbies/:id/entries', () => {
  it('公開済み募集枠は未認証でも 200 でメンバー一覧を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/entries');
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual([mockMember]);
  });

  it('存在しない募集枠なら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      listEntries: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request('/api/lobbies/nonexistent/entries');

    // Assert
    expect(response.status).toBe(404);
  });

  it('非公開募集枠にホスト以外がアクセスすると 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      listEntries: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/entries');

    // Assert
    expect(response.status).toBe(403);
  });

  it('非公開募集枠に未認証でアクセスすると 401 を返す', async () => {
    // Arrange
    const app = makeApp({
      getSession: vi.fn().mockResolvedValue(null),
      listEntries: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/entries');

    // Assert
    expect(response.status).toBe(401);
  });

  it('lobbyId と userId を listEntries に渡す', async () => {
    // Arrange
    const listEntries: (
      lobbyId: string,
      userId: string | null,
    ) => Promise<ListEntriesResult> = vi
      .fn()
      .mockResolvedValue({ type: 'ok', entries: [] });
    const app = makeApp({ listEntries });

    // Act
    await app.request('/api/lobbies/lobby-1/entries');

    // Assert
    expect(listEntries).toHaveBeenCalledWith('lobby-1', 'user-1');
  });
});

describe('POST /api/lobbies/:id/entries', () => {
  it('認証済みユーザーが参加すると 201 とメンバーを返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1/entries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const body = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(body).toEqual(mockMember);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/entries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    // Assert
    expect(response.status).toBe(401);
  });

  it('存在しない募集枠なら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      joinLobby: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request('/api/lobbies/nonexistent/entries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    // Assert
    expect(response.status).toBe(404);
  });

  it('open 以外の募集枠は 422 を返す', async () => {
    // Arrange
    const app = makeApp({
      joinLobby: vi.fn().mockResolvedValue({ type: 'lobbyNotOpen' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/entries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    // Assert
    expect(response.status).toBe(422);
  });

  it('すでに参加済みなら 409 を返す', async () => {
    // Arrange
    const app = makeApp({
      joinLobby: vi.fn().mockResolvedValue({ type: 'alreadyJoined' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/entries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    // Assert
    expect(response.status).toBe(409);
  });

  it('ユースケースに lobbyId・userId・input を渡す', async () => {
    // Arrange
    const joinLobby: (
      lobbyId: string,
      userId: string,
      input: unknown,
    ) => Promise<JoinLobbyResult> = vi
      .fn()
      .mockResolvedValue({ type: 'ok', member: mockMember });
    const app = makeApp({ joinLobby });

    // Act
    await app.request('/api/lobbies/lobby-1/entries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    // Assert
    expect(joinLobby).toHaveBeenCalledWith('lobby-1', 'user-1', {});
  });
});

describe('POST /api/lobbies/:id/guest-entries', () => {
  it('有効な Guest-Token で 201 とゲストメンバーを返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1/guest-entries', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [GUEST_TOKEN_HEADER]: 'guest-token-abc',
      },
      body: JSON.stringify({ guestName: 'ゲスト太郎' }),
    });
    const body = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(body).toEqual(mockGuestMember);
  });

  it('認証（セッション）は不要', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/guest-entries', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [GUEST_TOKEN_HEADER]: 'guest-token-abc',
      },
      body: JSON.stringify({ guestName: 'ゲスト太郎' }),
    });

    // Assert
    expect(response.status).toBe(201);
  });

  it('Guest-Token が一致しない場合は 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      joinAsGuest: vi.fn().mockResolvedValue({ type: 'invalidToken' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/guest-entries', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [GUEST_TOKEN_HEADER]: 'wrong-token',
      },
      body: JSON.stringify({ guestName: 'ゲスト太郎' }),
    });

    // Assert
    expect(response.status).toBe(403);
  });

  it('Guest-Token ヘッダーがない場合も 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      joinAsGuest: vi.fn().mockResolvedValue({ type: 'invalidToken' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/guest-entries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ guestName: 'ゲスト太郎' }),
    });

    // Assert
    expect(response.status).toBe(403);
  });

  it('存在しない募集枠なら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      joinAsGuest: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/nonexistent/guest-entries',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'guest-token-abc',
        },
        body: JSON.stringify({ guestName: 'ゲスト太郎' }),
      },
    );

    // Assert
    expect(response.status).toBe(404);
  });

  it('open 以外の募集枠は 422 を返す', async () => {
    // Arrange
    const app = makeApp({
      joinAsGuest: vi.fn().mockResolvedValue({ type: 'lobbyNotOpen' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/guest-entries', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [GUEST_TOKEN_HEADER]: 'guest-token-abc',
      },
      body: JSON.stringify({ guestName: 'ゲスト太郎' }),
    });

    // Assert
    expect(response.status).toBe(422);
  });

  it('guestName が空なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1/guest-entries', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [GUEST_TOKEN_HEADER]: 'guest-token-abc',
      },
      body: JSON.stringify({ guestName: '' }),
    });

    // Assert
    expect(response.status).toBe(400);
  });

  it('重複するゲスト参加も 201 を返す（dedup しない）', async () => {
    // Arrange
    const joinAsGuest: (
      lobbyId: string,
      token: string,
      input: unknown,
    ) => Promise<JoinAsGuestResult> = vi
      .fn()
      .mockResolvedValue({ type: 'ok', member: mockGuestMember });
    const app = makeApp({ joinAsGuest });
    const request = () =>
      app.request('/api/lobbies/lobby-1/guest-entries', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'guest-token-abc',
        },
        body: JSON.stringify({ guestName: 'ゲスト太郎' }),
      });

    // Act
    const first = await request();
    const second = await request();

    // Assert
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(joinAsGuest).toHaveBeenCalledTimes(2);
  });

  it('ユースケースに lobbyId・token・input を渡す', async () => {
    // Arrange
    const joinAsGuest: (
      lobbyId: string,
      token: string,
      input: unknown,
    ) => Promise<JoinAsGuestResult> = vi
      .fn()
      .mockResolvedValue({ type: 'ok', member: mockGuestMember });
    const app = makeApp({ joinAsGuest });

    // Act
    await app.request('/api/lobbies/lobby-1/guest-entries', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [GUEST_TOKEN_HEADER]: 'guest-token-abc',
      },
      body: JSON.stringify({ guestName: 'ゲスト太郎' }),
    });

    // Assert
    expect(joinAsGuest).toHaveBeenCalledWith('lobby-1', 'guest-token-abc', {
      guestName: 'ゲスト太郎',
    });
  });
});

describe('DELETE /api/lobbies/:id/entries/:entryId', () => {
  it('本人が退出すると 204 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/entries/member-1',
      { method: 'DELETE' },
    );

    // Assert
    expect(response.status).toBe(204);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/entries/member-1',
      { method: 'DELETE' },
    );

    // Assert
    expect(response.status).toBe(401);
  });

  it('本人でもホストでもない場合は 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      leaveLobby: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/entries/member-1',
      { method: 'DELETE' },
    );

    // Assert
    expect(response.status).toBe(403);
  });

  it('存在しないメンバーなら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      leaveLobby: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/entries/nonexistent',
      { method: 'DELETE' },
    );

    // Assert
    expect(response.status).toBe(404);
  });

  it('ホスト自身の退出は 422 を返す', async () => {
    // Arrange
    const app = makeApp({
      leaveLobby: vi.fn().mockResolvedValue({ type: 'hostCannotLeave' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/entries/member-host',
      { method: 'DELETE' },
    );

    // Assert
    expect(response.status).toBe(422);
  });

  it('確定済み・中止済みの募集枠は 409 を返す', async () => {
    // Arrange
    const app = makeApp({
      leaveLobby: vi.fn().mockResolvedValue({ type: 'invalidStatus' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/entries/member-1',
      { method: 'DELETE' },
    );

    // Assert
    expect(response.status).toBe(409);
  });

  it('ユースケースに lobbyId・memberId・userId を渡す', async () => {
    // Arrange
    const leaveLobby: (
      lobbyId: string,
      memberId: string,
      userId: string,
    ) => Promise<LeaveLobbyResult> = vi.fn().mockResolvedValue({ type: 'ok' });
    const app = makeApp({ leaveLobby });

    // Act
    await app.request('/api/lobbies/lobby-1/entries/member-1', {
      method: 'DELETE',
    });

    // Assert
    expect(leaveLobby).toHaveBeenCalledWith('lobby-1', 'member-1', 'user-1');
  });
});

describe('GET /api/lobbies/:id/guest-link', () => {
  it('ホストがリクエストすると 200 とトークンを返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1/guest-link');
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual({ token: 'guest-token-abc' });
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/guest-link');

    // Assert
    expect(response.status).toBe(401);
  });

  it('ホスト以外がリクエストすると 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      getGuestLink: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/guest-link');

    // Assert
    expect(response.status).toBe(403);
  });

  it('存在しない募集枠なら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      getGuestLink: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request('/api/lobbies/nonexistent/guest-link');

    // Assert
    expect(response.status).toBe(404);
  });

  it('ユースケースに id と userId を渡す', async () => {
    // Arrange
    const getGuestLink: (
      id: string,
      userId: string,
    ) => Promise<GetGuestLinkResult> = vi
      .fn()
      .mockResolvedValue({ type: 'ok', token: 'guest-token-abc' });
    const app = makeApp({ getGuestLink });

    // Act
    await app.request('/api/lobbies/lobby-1/guest-link');

    // Assert
    expect(getGuestLink).toHaveBeenCalledWith('lobby-1', 'user-1');
  });
});

describe('POST /api/lobbies/:id/guest-link（トークンの再発行）', () => {
  it('ホストがリクエストすると 200 と新しいトークンを返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1/guest-link', {
      method: 'POST',
    });
    const body = await response.json();

    // Assert — 新規リソースの作成ではないので 201 ではなく 200
    expect(response.status).toBe(200);
    expect(body).toEqual({ token: 'regenerated-token' });
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/guest-link', {
      method: 'POST',
    });

    // Assert
    expect(response.status).toBe(401);
  });

  it('ホスト以外がリクエストすると 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      regenerateGuestLink: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/guest-link', {
      method: 'POST',
    });

    // Assert
    expect(response.status).toBe(403);
  });

  it('存在しないロビーなら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      regenerateGuestLink: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request('/api/lobbies/nonexistent/guest-link', {
      method: 'POST',
    });

    // Assert
    expect(response.status).toBe(404);
  });

  it('解散済みのロビーなら 422 を返す', async () => {
    // Arrange
    const app = makeApp({
      regenerateGuestLink: vi.fn().mockResolvedValue({ type: 'invalidStatus' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/guest-link', {
      method: 'POST',
    });

    // Assert
    expect(response.status).toBe(422);
  });

  it('ユースケースに id と userId を渡す', async () => {
    // Arrange
    const regenerateGuestLink = vi
      .fn()
      .mockResolvedValue({ type: 'ok', token: 'regenerated-token' });
    const app = makeApp({ regenerateGuestLink });

    // Act
    await app.request('/api/lobbies/lobby-1/guest-link', { method: 'POST' });

    // Assert
    expect(regenerateGuestLink).toHaveBeenCalledWith('lobby-1', 'user-1');
  });
});

describe('GET /api/lobbies/:id/schedule-polls', () => {
  it('公開済み募集枠は未認証でも 200 で日程調整の要約一覧を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/schedule-polls');
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual([mockSchedulePollSummary]);
  });

  it('存在しない募集枠なら 404 を返す', async () => {
    // Arrange
    const listSchedulePolls = vi.fn().mockResolvedValue({ type: 'notFound' });
    const app = makeApp({ listSchedulePolls });

    // Act
    const response = await app.request(
      '/api/lobbies/nonexistent/schedule-polls',
    );

    // Assert
    expect(response.status).toBe(404);
  });

  it('非公開の募集枠を未認証で見ると 401 を返す', async () => {
    // Arrange
    const listSchedulePolls = vi.fn().mockResolvedValue({ type: 'forbidden' });
    const app = makeApp({
      listSchedulePolls,
      getSession: vi.fn().mockResolvedValue(null),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/schedule-polls');

    // Assert
    expect(response.status).toBe(401);
  });

  it('非公開の募集枠をホスト以外が見ると 403 を返す', async () => {
    // Arrange
    const listSchedulePolls = vi.fn().mockResolvedValue({ type: 'forbidden' });
    const app = makeApp({ listSchedulePolls });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/schedule-polls');

    // Assert
    expect(response.status).toBe(403);
  });

  it('lobbyId と userId を listSchedulePolls に渡す', async () => {
    // Arrange
    const listSchedulePolls: (
      lobbyId: string,
      userId: string | null,
    ) => Promise<ListSchedulePollsResult> = vi
      .fn()
      .mockResolvedValue({ type: 'ok', polls: [] });
    const app = makeApp({ listSchedulePolls });

    // Act
    await app.request('/api/lobbies/lobby-1/schedule-polls');

    // Assert
    expect(listSchedulePolls).toHaveBeenCalledWith('lobby-1', 'user-1');
  });
});

describe('POST /api/lobbies/:id/schedule-polls', () => {
  it('有効なボディで 201 と日程調整を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1/schedule-polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        candidateDates: [{ date: '2099-09-01' }],
      }),
    });
    const body = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(body).toEqual(mockSchedulePoll);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/schedule-polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        candidateDates: [{ date: '2099-09-01' }],
      }),
    });

    // Assert
    expect(response.status).toBe(401);
  });

  it('不正な JSON なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1/schedule-polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{invalid',
    });

    // Assert
    expect(response.status).toBe(400);
  });

  it('candidateDates が空なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1/schedule-polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ candidateDates: [] }),
    });

    // Assert
    expect(response.status).toBe(400);
  });

  it('存在しない募集枠なら 404 を返す', async () => {
    // Arrange
    const createSchedulePoll = vi.fn().mockResolvedValue({ type: 'notFound' });
    const app = makeApp({ createSchedulePoll });

    // Act
    const response = await app.request(
      '/api/lobbies/nonexistent/schedule-polls',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          candidateDates: [{ date: '2099-09-01' }],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(404);
  });

  it('ホスト以外なら 403 を返す', async () => {
    // Arrange
    const createSchedulePoll = vi.fn().mockResolvedValue({ type: 'forbidden' });
    const app = makeApp({ createSchedulePoll });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/schedule-polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        candidateDates: [{ date: '2099-09-01' }],
      }),
    });

    // Assert
    expect(response.status).toBe(403);
  });

  it('募集枠が disbanded なら 422 を返す', async () => {
    // Arrange
    const createSchedulePoll = vi
      .fn()
      .mockResolvedValue({ type: 'invalidStatus' });
    const app = makeApp({ createSchedulePoll });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/schedule-polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        candidateDates: [{ date: '2099-09-01' }],
      }),
    });

    // Assert
    expect(response.status).toBe(422);
  });

  it('lobbyId・userId・body を createSchedulePoll に渡す', async () => {
    // Arrange
    const createSchedulePoll: (
      lobbyId: string,
      userId: string,
      input: CreateSchedulePollInput,
    ) => Promise<CreateSchedulePollResult> = vi
      .fn()
      .mockResolvedValue({ type: 'ok', poll: mockSchedulePoll });
    const app = makeApp({ createSchedulePoll });

    // Act
    await app.request('/api/lobbies/lobby-1/schedule-polls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        candidateDates: [{ date: '2099-09-01', timeLabel: '夜' }],
      }),
    });

    // Assert
    expect(createSchedulePoll).toHaveBeenCalledWith('lobby-1', 'user-1', {
      candidateDates: [{ date: '2099-09-01', timeLabel: '夜' }],
    });
  });
});

describe('GET /api/lobbies/:id/schedule-polls/:pollId', () => {
  it('公開済み募集枠は未認証でも 200 で日程調整を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1',
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockSchedulePoll);
  });

  it('存在しない調整なら 404 を返す', async () => {
    // Arrange
    const getSchedulePoll = vi.fn().mockResolvedValue({ type: 'notFound' });
    const app = makeApp({ getSchedulePoll });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/nonexistent',
    );

    // Assert
    expect(response.status).toBe(404);
  });

  it('非公開の募集枠を未認証で見ると 401 を返す', async () => {
    // Arrange
    const getSchedulePoll = vi.fn().mockResolvedValue({ type: 'forbidden' });
    const app = makeApp({
      getSchedulePoll,
      getSession: vi.fn().mockResolvedValue(null),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1',
    );

    // Assert
    expect(response.status).toBe(401);
  });

  it('非公開の募集枠をホスト以外が見ると 403 を返す', async () => {
    // Arrange
    const getSchedulePoll = vi.fn().mockResolvedValue({ type: 'forbidden' });
    const app = makeApp({ getSchedulePoll });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1',
    );

    // Assert
    expect(response.status).toBe(403);
  });
});

describe('PUT /api/lobbies/:id/schedule-polls/:pollId/candidate-dates', () => {
  it('有効なボディで 200 と候補日一覧を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/candidate-dates',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          candidateDates: [{ date: '2099-09-01', timeLabel: '夜' }],
        }),
      },
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual([mockCandidateDate]);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/candidate-dates',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          candidateDates: [{ date: '2099-09-01' }],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(401);
  });

  it('candidateDates が空なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/candidate-dates',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ candidateDates: [] }),
      },
    );

    // Assert
    expect(response.status).toBe(400);
  });

  it('存在しない調整なら 404 を返す', async () => {
    // Arrange
    const replaceCandidateDates = vi
      .fn()
      .mockResolvedValue({ type: 'notFound' });
    const app = makeApp({ replaceCandidateDates });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/nonexistent/candidate-dates',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          candidateDates: [{ date: '2099-09-01' }],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(404);
  });

  it('ホスト以外なら 403 を返す', async () => {
    // Arrange
    const replaceCandidateDates = vi
      .fn()
      .mockResolvedValue({ type: 'forbidden' });
    const app = makeApp({ replaceCandidateDates });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/candidate-dates',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          candidateDates: [{ date: '2099-09-01' }],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(403);
  });

  it('募集枠が disbanded なら 422 を返す', async () => {
    // Arrange
    const replaceCandidateDates = vi
      .fn()
      .mockResolvedValue({ type: 'invalidStatus' });
    const app = makeApp({ replaceCandidateDates });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/candidate-dates',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          candidateDates: [{ date: '2099-09-01' }],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(422);
  });

  it('最新の調整でなければ 409 を返す', async () => {
    // Arrange
    const replaceCandidateDates = vi
      .fn()
      .mockResolvedValue({ type: 'notLatest' });
    const app = makeApp({ replaceCandidateDates });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/candidate-dates',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          candidateDates: [{ date: '2099-09-01' }],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(409);
  });

  it('現在の調整に無い過去日を追加すると 400 を返す', async () => {
    // Arrange
    const replaceCandidateDates = vi
      .fn()
      .mockResolvedValue({ type: 'pastDateAdded' });
    const app = makeApp({ replaceCandidateDates });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/candidate-dates',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          candidateDates: [{ date: '2020-01-01' }],
        }),
      },
    );
    const body = (await response.json()) as { error: string };

    // Assert
    expect(response.status).toBe(400);
    expect(body.error).toContain('past date');
  });
});

describe('PATCH /api/lobbies/:id/schedule-polls/:pollId/answers', () => {
  it('有効なボディで 200 と回答一覧を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/answers',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          answers: [
            {
              candidateDateId: 'cccccccc-0000-4000-8000-000000000001',
              answer: 'ok',
            },
          ],
        }),
      },
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual([mockScheduleAnswer]);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/answers',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          answers: [
            {
              candidateDateId: 'cccccccc-0000-4000-8000-000000000001',
              answer: 'ok',
            },
          ],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(401);
  });

  it('answers が空なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/answers',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answers: [] }),
      },
    );

    // Assert
    expect(response.status).toBe(400);
  });

  it('存在しない調整なら 404 を返す', async () => {
    // Arrange
    const upsertScheduleAnswers = vi
      .fn()
      .mockResolvedValue({ type: 'notFound' });
    const app = makeApp({ upsertScheduleAnswers });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/nonexistent/answers',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          answers: [
            {
              candidateDateId: 'cccccccc-0000-4000-8000-000000000001',
              answer: 'ok',
            },
          ],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(404);
  });

  it('脱退済み・未参加なら 403 を返す', async () => {
    // Arrange
    const upsertScheduleAnswers = vi
      .fn()
      .mockResolvedValue({ type: 'forbidden' });
    const app = makeApp({ upsertScheduleAnswers });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/answers',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          answers: [
            {
              candidateDateId: 'cccccccc-0000-4000-8000-000000000001',
              answer: 'ok',
            },
          ],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(403);
  });

  it('最新の調整でなければ 409 を返す', async () => {
    // Arrange
    const upsertScheduleAnswers = vi
      .fn()
      .mockResolvedValue({ type: 'notLatest' });
    const app = makeApp({ upsertScheduleAnswers });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/answers',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          answers: [
            {
              candidateDateId: 'cccccccc-0000-4000-8000-000000000001',
              answer: 'ok',
            },
          ],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(409);
  });

  it('募集枠が未公開なら 422 を返す', async () => {
    // Arrange
    const upsertScheduleAnswers = vi
      .fn()
      .mockResolvedValue({ type: 'notPublished' });
    const app = makeApp({ upsertScheduleAnswers });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/answers',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          answers: [
            {
              candidateDateId: 'cccccccc-0000-4000-8000-000000000001',
              answer: 'ok',
            },
          ],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(422);
  });

  it('募集枠が disbanded なら 422 を返す', async () => {
    // Arrange
    const upsertScheduleAnswers = vi
      .fn()
      .mockResolvedValue({ type: 'invalidStatus' });
    const app = makeApp({ upsertScheduleAnswers });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/answers',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          answers: [
            {
              candidateDateId: 'cccccccc-0000-4000-8000-000000000001',
              answer: 'ok',
            },
          ],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(422);
  });
});

describe('PATCH /api/lobbies/:id/schedule-polls/:pollId/guest-answers', () => {
  it('有効なボディで 200 と回答一覧を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/guest-answers',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'guest-token-abc',
        },
        body: JSON.stringify({
          entryId: 'dddddddd-0000-4000-8000-000000000002',
          answers: [
            {
              candidateDateId: 'cccccccc-0000-4000-8000-000000000001',
              answer: 'ok',
            },
          ],
        }),
      },
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual([mockScheduleAnswer]);
  });

  it('不正な JSON なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/guest-answers',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: '{invalid',
      },
    );

    // Assert
    expect(response.status).toBe(400);
  });

  it('entryId が無ければ 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/guest-answers',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          answers: [
            {
              candidateDateId: 'cccccccc-0000-4000-8000-000000000001',
              answer: 'ok',
            },
          ],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(400);
  });

  it('存在しない調整なら 404 を返す', async () => {
    // Arrange
    const upsertGuestScheduleAnswers = vi
      .fn()
      .mockResolvedValue({ type: 'notFound' });
    const app = makeApp({ upsertGuestScheduleAnswers });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/nonexistent/guest-answers',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'guest-token-abc',
        },
        body: JSON.stringify({
          entryId: 'dddddddd-0000-4000-8000-000000000002',
          answers: [
            {
              candidateDateId: 'cccccccc-0000-4000-8000-000000000001',
              answer: 'ok',
            },
          ],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(404);
  });

  it('トークン不一致なら 403 を返す', async () => {
    // Arrange
    const upsertGuestScheduleAnswers = vi
      .fn()
      .mockResolvedValue({ type: 'invalidToken' });
    const app = makeApp({ upsertGuestScheduleAnswers });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/guest-answers',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'wrong-token',
        },
        body: JSON.stringify({
          entryId: 'dddddddd-0000-4000-8000-000000000002',
          answers: [
            {
              candidateDateId: 'cccccccc-0000-4000-8000-000000000001',
              answer: 'ok',
            },
          ],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(403);
  });

  it('ゲスト以外・脱退済みの entryId を指定すると 403 を返す', async () => {
    // Arrange
    const upsertGuestScheduleAnswers = vi
      .fn()
      .mockResolvedValue({ type: 'forbidden' });
    const app = makeApp({ upsertGuestScheduleAnswers });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/guest-answers',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'guest-token-abc',
        },
        body: JSON.stringify({
          entryId: 'dddddddd-0000-4000-8000-000000000001',
          answers: [
            {
              candidateDateId: 'cccccccc-0000-4000-8000-000000000001',
              answer: 'ok',
            },
          ],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(403);
  });

  it('最新の調整でなければ 409 を返す', async () => {
    // Arrange
    const upsertGuestScheduleAnswers = vi
      .fn()
      .mockResolvedValue({ type: 'notLatest' });
    const app = makeApp({ upsertGuestScheduleAnswers });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/guest-answers',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'guest-token-abc',
        },
        body: JSON.stringify({
          entryId: 'dddddddd-0000-4000-8000-000000000002',
          answers: [
            {
              candidateDateId: 'cccccccc-0000-4000-8000-000000000001',
              answer: 'ok',
            },
          ],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(409);
  });

  it('募集枠が draft・disbanded なら 422 を返す', async () => {
    // Arrange
    const upsertGuestScheduleAnswers = vi
      .fn()
      .mockResolvedValue({ type: 'invalidStatus' });
    const app = makeApp({ upsertGuestScheduleAnswers });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/guest-answers',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'guest-token-abc',
        },
        body: JSON.stringify({
          entryId: 'dddddddd-0000-4000-8000-000000000002',
          answers: [
            {
              candidateDateId: 'cccccccc-0000-4000-8000-000000000001',
              answer: 'ok',
            },
          ],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(422);
  });

  it('lobbyId・pollId・token・入力全体（entryId 含む）を upsertGuestScheduleAnswers にそのまま渡す', async () => {
    // Arrange
    const upsertGuestScheduleAnswers: (
      lobbyId: string,
      pollId: string,
      token: string,
      input: GuestUpsertScheduleAnswersInput,
    ) => Promise<UpsertGuestScheduleAnswersResult> = vi
      .fn()
      .mockResolvedValue({ type: 'ok', answers: [mockScheduleAnswer] });
    const app = makeApp({ upsertGuestScheduleAnswers });

    // Act
    await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/guest-answers',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'guest-token-abc',
        },
        body: JSON.stringify({
          entryId: 'dddddddd-0000-4000-8000-000000000002',
          answers: [
            {
              candidateDateId: 'cccccccc-0000-4000-8000-000000000001',
              answer: 'ok',
            },
          ],
        }),
      },
    );

    // Assert
    expect(upsertGuestScheduleAnswers).toHaveBeenCalledWith(
      'lobby-1',
      'poll-1',
      'guest-token-abc',
      {
        entryId: 'dddddddd-0000-4000-8000-000000000002',
        answers: [
          {
            candidateDateId: 'cccccccc-0000-4000-8000-000000000001',
            answer: 'ok',
          },
        ],
      },
    );
  });
});

describe('POST → PATCH(公開) → GET の一連フロー', () => {
  it('作成 → 公開 → 取得が一連で成功する', async () => {
    // Arrange
    // ステートフルな in-memory 実装で一連のフローを検証する
    let stored: Lobby | null = null;
    const createLobby = vi.fn(
      async (userId: string, input: CreateLobbyInput): Promise<Lobby> => {
        stored = {
          ...mockLobby,
          title: input.title,
          hostUserId: userId,
          status: LobbyStatus.draft,
          publishedAt: null,
        };
        return stored;
      },
    );
    const updateLobbyStatus = vi.fn(
      async (
        _id: string,
        _userId: string,
        input: UpdateLobbyStatusInput,
      ): Promise<UpdateLobbyStatusResult> => {
        if (input.status === 'open' && stored) {
          const updated: Lobby = {
            ...stored,
            status: LobbyStatus.open,
            publishedAt: '2026-01-01T00:00:00.000Z',
          };
          stored = updated;
          return { type: 'ok' as const, lobby: updated };
        }
        return { type: 'invalidTransition' as const };
      },
    );
    const getLobby = vi.fn(async (): Promise<GetLobbyResult> => {
      if (!stored) return { type: 'notFound' };
      return {
        type: 'ok',
        lobby: { ...stored, entries: [], schedulePolls: [] },
      };
    });
    const app = makeApp({ createLobby, updateLobbyStatus, getLobby });

    // Act 1: 作成
    const createRes = await app.request('/api/lobbies', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'フロー確認',
        candidateDates: [{ date: '2099-09-01' }],
      }),
    });
    const created = (await createRes.json()) as Lobby;

    // Act 2: 公開
    const publishRes = await app.request(`/api/lobbies/${created.id}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    });
    const published = (await publishRes.json()) as Lobby;

    // Act 3: 取得
    const getRes = await app.request(`/api/lobbies/${created.id}`);
    const detail = (await getRes.json()) as LobbyDetail;

    // Assert
    expect(createRes.status).toBe(201);
    expect(created.status).toBe('draft');
    expect(publishRes.status).toBe(200);
    expect(published.status).toBe('open');
    expect(published.publishedAt).not.toBeNull();
    expect(getRes.status).toBe(200);
    expect(detail.status).toBe('open');
    expect(detail.title).toBe('フロー確認');
  });
});

describe('ゲストリンク発行 → ゲスト参加 → ゲスト回答の一連フロー', () => {
  it('ホストが発行したゲストリンクでゲストが参加し、そのゲストとして日程回答できる', async () => {
    // Arrange
    // ステートフルな in-memory 実装で、募集枠・トークン・ゲストメンバー・回答を一貫して検証する
    const guestLinkToken = 'flow-guest-token-xyz';
    const guestMembers = new Map<string, LobbyEntry>();
    let nextMemberId = 1;
    const answers = new Map<string, LobbyScheduleAnswer>();

    const getGuestLink = vi.fn(
      async (): Promise<GetGuestLinkResult> => ({
        type: 'ok',
        token: guestLinkToken,
      }),
    );

    const joinAsGuest = vi.fn(
      async (
        _lobbyId: string,
        token: string,
        input: { guestName: string },
      ): Promise<JoinAsGuestResult> => {
        if (token !== guestLinkToken) return { type: 'invalidToken' };
        const member: LobbyEntry = {
          id: `aaaaaaaa-0000-4000-8000-00000000000${nextMemberId++}`,
          userId: null,
          userName: null,
          guestName: input.guestName,
          joinedAt: '2025-01-01T00:00:00.000Z',
          leftAt: null,
        };
        guestMembers.set(member.id, member);
        return { type: 'ok', entry: member };
      },
    );

    const upsertGuestScheduleAnswers = vi.fn(
      async (
        _lobbyId: string,
        _pollId: string,
        token: string,
        input: GuestUpsertScheduleAnswersInput,
      ): Promise<UpsertGuestScheduleAnswersResult> => {
        if (token !== guestLinkToken) return { type: 'invalidToken' };
        if (!guestMembers.has(input.entryId)) return { type: 'forbidden' };
        const item = input.answers[0];
        if (!item) return { type: 'forbidden' };
        const answer: LobbyScheduleAnswer = {
          id: `answer-${input.entryId}`,
          entryId: input.entryId,
          answer: item.answer,
          comment: item.comment ?? null,
        };
        answers.set(input.entryId, answer);
        return { type: 'ok', answers: [answer] };
      },
    );

    const app = makeApp({
      getSession: vi.fn().mockResolvedValue(mockSession),
      getGuestLink,
      joinAsGuest,
      upsertGuestScheduleAnswers,
    });

    // Act 1: ホストがゲストリンクを発行する
    const guestLinkRes = await app.request('/api/lobbies/lobby-1/guest-link');
    const { token } = (await guestLinkRes.json()) as { token: string };

    // Act 2: 発行されたトークンでゲストが参加する
    const joinRes = await app.request('/api/lobbies/lobby-1/guest-entries', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [GUEST_TOKEN_HEADER]: token,
      },
      body: JSON.stringify({ guestName: 'ゲスト花子' }),
    });
    const joinedMember = (await joinRes.json()) as LobbyEntry;

    // Act 3: 参加したゲストとして日程回答する
    const responseRes = await app.request(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/guest-answers',
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: token,
        },
        body: JSON.stringify({
          entryId: joinedMember.id,
          answers: [
            {
              candidateDateId: 'cccccccc-0000-4000-8000-000000000001',
              answer: 'ok',
              comment: '参加します',
            },
          ],
        }),
      },
    );
    const responseAnswers = (await responseRes.json()) as LobbyScheduleAnswer[];

    // Assert
    expect(guestLinkRes.status).toBe(200);
    expect(token).toBe(guestLinkToken);
    expect(joinRes.status).toBe(201);
    expect(joinedMember.guestName).toBe('ゲスト花子');
    expect(joinedMember.userId).toBeNull();
    expect(responseRes.status).toBe(200);
    expect(responseAnswers[0]?.entryId).toBe(joinedMember.id);
    expect(responseAnswers[0]?.answer).toBe('ok');
    expect(answers.get(joinedMember.id)).toMatchObject({
      entryId: joinedMember.id,
      answer: 'ok',
      comment: '参加します',
    });
  });
});
