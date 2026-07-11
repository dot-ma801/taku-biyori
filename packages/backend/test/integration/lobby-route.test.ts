import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@/app/presentation/controller/create-app';
import type { GameSessionUseCases } from '@/game-session/application/use-cases';
import type { ProfileUseCases } from '@/profile/application/use-cases';
import type { LobbyUseCases } from '@/lobby/application/use-cases';
import type {
  Lobby,
  LobbyDetail,
  LobbyListItem,
  LobbyMember,
  CreateLobbyInput,
  UpdateLobbyStatusInput,
} from '@taku-biyori/shared';
import { GUEST_TOKEN_HEADER } from '@taku-biyori/shared';
import type { GetLobbyResult } from '@/lobby/application/get-lobby';
import type { ListMembersResult } from '@/lobby/application/list-members';
import type { JoinLobbyResult } from '@/lobby/application/join-lobby';
import type { JoinAsGuestResult } from '@/lobby/application/join-as-guest';
import type { LeaveLobbyResult } from '@/lobby/application/leave-lobby';
import type { GetGuestLinkResult } from '@/lobby/application/get-guest-link';

const mockSession = { user: { id: 'user-1' } };

const mockMember: LobbyMember = {
  id: 'member-1',
  userId: 'user-2',
  userName: 'テストユーザー',
  guestName: null,
  joinedAt: '2025-01-01T00:00:00.000Z',
};

const mockGuestMember: LobbyMember = {
  id: 'member-2',
  userId: null,
  userName: null,
  guestName: 'ゲスト太郎',
  joinedAt: '2025-01-01T00:00:00.000Z',
};

const mockListItem: LobbyListItem = {
  id: 'f2b4dbb8-0000-4000-8000-000000000001',
  title: 'テスト募集',
  status: 'draft',
  isPublished: false,
  memberCount: 1,
  role: 'host',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockLobby: Lobby = {
  id: 'f2b4dbb8-0000-4000-8000-000000000001',
  title: '新規募集',
  status: 'draft',
  isPublished: false,
  hostUserId: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockLobbyDetail: LobbyDetail = {
  ...mockLobby,
  members: [],
};

const mockGetOk: GetLobbyResult = {
  type: 'ok',
  lobby: mockLobbyDetail,
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
    listMembers:
      overrides.listMembers ??
      vi.fn().mockResolvedValue({ type: 'ok', members: [mockMember] }),
    joinLobby:
      overrides.joinLobby ??
      vi.fn().mockResolvedValue({ type: 'ok', member: mockMember }),
    joinAsGuest:
      overrides.joinAsGuest ??
      vi.fn().mockResolvedValue({ type: 'ok', member: mockGuestMember }),
    leaveLobby:
      overrides.leaveLobby ?? vi.fn().mockResolvedValue({ type: 'ok' }),
    getGuestLink:
      overrides.getGuestLink ??
      vi.fn().mockResolvedValue({ type: 'ok', token: 'guest-token-abc' }),
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
        candidateDates: ['2099-09-01'],
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
        candidateDates: ['2099-09-01'],
      }),
    });

    // Assert
    expect(response.status).toBe(401);
  });

  it('candidateDates が空配列なら 422 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '募集', candidateDates: [] }),
    });

    // Assert
    expect(response.status).toBe(422);
  });

  it('candidateDates 未指定なら 422 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '募集' }),
    });

    // Assert
    expect(response.status).toBe(422);
  });

  it('title が空なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '', candidateDates: ['2099-09-01'] }),
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
        candidateDates: ['2099-09-01'],
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
        candidateDates: ['2099-09-01', '2099-09-02'],
      }),
    });

    // Assert
    expect(createLobby).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        title: '詳細募集',
        maxPlayers: 4,
        candidateDates: ['2099-09-01', '2099-09-02'],
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

  it('confirmed/cancelled の募集枠は 409 を返す', async () => {
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

  it('確定済み募集枠は 409 を返す', async () => {
    // Arrange
    const app = makeApp({
      deleteLobby: vi.fn().mockResolvedValue({ type: 'invalidStatus' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1', {
      method: 'DELETE',
    });

    // Assert
    expect(response.status).toBe(409);
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

  it('ホストが cancelled に遷移すると 200 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
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

  it('不正な遷移なら 409 を返す', async () => {
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
      body: JSON.stringify({ status: 'cancelled' }),
    });

    // Assert
    expect(response.status).toBe(409);
  });

  it('不正な status 値なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1/status', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' }),
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

describe('GET /api/lobbies/:id/members', () => {
  it('公開済み募集枠は未認証でも 200 でメンバー一覧を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/members');
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual([mockMember]);
  });

  it('存在しない募集枠なら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      listMembers: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request('/api/lobbies/nonexistent/members');

    // Assert
    expect(response.status).toBe(404);
  });

  it('非公開募集枠にホスト以外がアクセスすると 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      listMembers: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/members');

    // Assert
    expect(response.status).toBe(403);
  });

  it('非公開募集枠に未認証でアクセスすると 401 を返す', async () => {
    // Arrange
    const app = makeApp({
      getSession: vi.fn().mockResolvedValue(null),
      listMembers: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/members');

    // Assert
    expect(response.status).toBe(401);
  });

  it('lobbyId と userId を listMembers に渡す', async () => {
    // Arrange
    const listMembers: (
      lobbyId: string,
      userId: string | null,
    ) => Promise<ListMembersResult> = vi
      .fn()
      .mockResolvedValue({ type: 'ok', members: [] });
    const app = makeApp({ listMembers });

    // Act
    await app.request('/api/lobbies/lobby-1/members');

    // Assert
    expect(listMembers).toHaveBeenCalledWith('lobby-1', 'user-1');
  });
});

describe('POST /api/lobbies/:id/members', () => {
  it('認証済みユーザーが参加すると 201 とメンバーを返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1/members', {
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
    const response = await app.request('/api/lobbies/lobby-1/members', {
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
    const response = await app.request('/api/lobbies/nonexistent/members', {
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
    const response = await app.request('/api/lobbies/lobby-1/members', {
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
    const response = await app.request('/api/lobbies/lobby-1/members', {
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
    await app.request('/api/lobbies/lobby-1/members', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    // Assert
    expect(joinLobby).toHaveBeenCalledWith('lobby-1', 'user-1', {});
  });
});

describe('POST /api/lobbies/:id/guest-members', () => {
  it('有効な Guest-Token で 201 とゲストメンバーを返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1/guest-members', {
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
    const response = await app.request('/api/lobbies/lobby-1/guest-members', {
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
    const response = await app.request('/api/lobbies/lobby-1/guest-members', {
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
    const response = await app.request('/api/lobbies/lobby-1/guest-members', {
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
      '/api/lobbies/nonexistent/guest-members',
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
    const response = await app.request('/api/lobbies/lobby-1/guest-members', {
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
    const response = await app.request('/api/lobbies/lobby-1/guest-members', {
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
      app.request('/api/lobbies/lobby-1/guest-members', {
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
    await app.request('/api/lobbies/lobby-1/guest-members', {
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

describe('DELETE /api/lobbies/:id/members/:memberId', () => {
  it('本人が退出すると 204 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/members/member-1',
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
      '/api/lobbies/lobby-1/members/member-1',
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
      '/api/lobbies/lobby-1/members/member-1',
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
      '/api/lobbies/lobby-1/members/nonexistent',
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
      '/api/lobbies/lobby-1/members/member-host',
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
      '/api/lobbies/lobby-1/members/member-1',
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
    await app.request('/api/lobbies/lobby-1/members/member-1', {
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
          status: 'draft',
          isPublished: false,
        };
        return stored;
      },
    );
    const updateLobbyStatus = vi.fn(
      async (_id: string, _userId: string, input: UpdateLobbyStatusInput) => {
        if (input.status === 'open' && stored) {
          stored = { ...stored, status: 'open', isPublished: true };
          return { type: 'ok' as const, lobby: stored };
        }
        return { type: 'invalidTransition' as const };
      },
    );
    const getLobby = vi.fn(async (): Promise<GetLobbyResult> => {
      if (!stored) return { type: 'notFound' };
      return { type: 'ok', lobby: { ...stored, members: [] } };
    });
    const app = makeApp({ createLobby, updateLobbyStatus, getLobby });

    // Act 1: 作成
    const createRes = await app.request('/api/lobbies', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'フロー確認',
        candidateDates: ['2099-09-01'],
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
    expect(published.isPublished).toBe(true);
    expect(getRes.status).toBe(200);
    expect(detail.status).toBe('open');
    expect(detail.title).toBe('フロー確認');
  });
});
