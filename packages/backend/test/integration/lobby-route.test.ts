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
  LobbyAvailabilityDate,
  LobbyAvailabilityDateAnswer,
  CreateLobbyInput,
  UpdateLobbyStatusInput,
  GameSession,
} from '@taku-biyori/shared';
import { DATE_NOTE_MAX_LENGTH, GUEST_TOKEN_HEADER } from '@taku-biyori/shared';
import type { GetLobbyResult } from '@/lobby/application/get-lobby';
import type { ListMembersResult } from '@/lobby/application/list-members';
import type { JoinLobbyResult } from '@/lobby/application/join-lobby';
import type { JoinAsGuestResult } from '@/lobby/application/join-as-guest';
import type { LeaveLobbyResult } from '@/lobby/application/leave-lobby';
import type { GetGuestLinkResult } from '@/lobby/application/get-guest-link';
import type { ListAvailabilityDatesResult } from '@/lobby/application/list-availability-dates';
import type { AddAvailabilityDateResult } from '@/lobby/application/add-availability-date';
import type { BulkUpdateAvailabilityDatesResult } from '@/lobby/application/bulk-update-availability-dates';
import type { DeleteAvailabilityDateResult } from '@/lobby/application/delete-availability-date';
import type { UpdateAvailabilityDateResponseResult } from '@/lobby/application/update-availability-date-response';
import type { UpdateGuestAvailabilityDateResponseResult } from '@/lobby/application/update-guest-availability-date-response';
import type { ConfirmLobbyResult } from '@/lobby/application/confirm-lobby';

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

const mockAvailabilityDate: LobbyAvailabilityDate = {
  id: 'date-1',
  date: '2025-09-01',
  dateNote: null,
  answers: [],
};

const mockAnswer: LobbyAvailabilityDateAnswer = {
  id: 'answer-1',
  memberId: 'member-1',
  answer: 'ok',
  comment: null,
};

const mockGameSession: GameSession = {
  id: 'game-session-1',
  title: '新規募集',
  status: 'confirmed',
  isPublished: true,
  scheduledAt: '2099-09-01',
  lobbyId: mockLobby.id,
  createdBy: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
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
    listAvailabilityDates:
      overrides.listAvailabilityDates ??
      vi.fn().mockResolvedValue({ type: 'ok', dates: [mockAvailabilityDate] }),
    addAvailabilityDate:
      overrides.addAvailabilityDate ??
      vi.fn().mockResolvedValue({ type: 'ok', date: mockAvailabilityDate }),
    bulkUpdateAvailabilityDates:
      overrides.bulkUpdateAvailabilityDates ??
      vi.fn().mockResolvedValue({ type: 'ok', dates: [mockAvailabilityDate] }),
    deleteAvailabilityDate:
      overrides.deleteAvailabilityDate ??
      vi.fn().mockResolvedValue({ type: 'ok' }),
    updateAvailabilityDateResponse:
      overrides.updateAvailabilityDateResponse ??
      vi.fn().mockResolvedValue({ type: 'ok', answer: mockAnswer }),
    updateGuestAvailabilityDateResponse:
      overrides.updateGuestAvailabilityDateResponse ??
      vi.fn().mockResolvedValue({ type: 'ok', answer: mockAnswer }),
    confirmLobby:
      overrides.confirmLobby ??
      vi.fn().mockResolvedValue({ type: 'ok', gameSession: mockGameSession }),
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

describe('POST /api/lobbies/:id/confirm', () => {
  const candidateId = 'cccccccc-0000-4000-8000-000000000001';
  const memberId1 = 'aaaaaaaa-0000-4000-8000-000000000001';
  const memberId2 = 'aaaaaaaa-0000-4000-8000-000000000002';

  it('ホストが有効なボディで確定すると 201 と作成された卓を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ candidateId, memberIds: [memberId1] }),
    });
    const body = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(body).toEqual(mockGameSession);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ candidateId, memberIds: [memberId1] }),
    });

    // Assert
    expect(response.status).toBe(401);
  });

  it('ホスト以外は 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      confirmLobby: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ candidateId, memberIds: [memberId1] }),
    });

    // Assert
    expect(response.status).toBe(403);
  });

  it('存在しない募集枠なら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      confirmLobby: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request('/api/lobbies/nonexistent/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ candidateId, memberIds: [memberId1] }),
    });

    // Assert
    expect(response.status).toBe(404);
  });

  it('draft・cancelled 状態の募集枠は 422 を返す', async () => {
    // Arrange
    const app = makeApp({
      confirmLobby: vi.fn().mockResolvedValue({ type: 'invalidStatus' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ candidateId, memberIds: [memberId1] }),
    });

    // Assert
    expect(response.status).toBe(422);
  });

  it('candidateId がこの募集枠の候補日でない場合は 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      confirmLobby: vi.fn().mockResolvedValue({ type: 'candidateNotFound' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ candidateId, memberIds: [memberId1] }),
    });

    // Assert
    expect(response.status).toBe(404);
  });

  it('memberIds にこの募集枠のメンバーでない ID を含む場合は 422 を返す', async () => {
    // Arrange
    const app = makeApp({
      confirmLobby: vi.fn().mockResolvedValue({ type: 'invalidMembers' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ candidateId, memberIds: [memberId2] }),
    });

    // Assert
    expect(response.status).toBe(422);
  });

  it('確定済み・並行確定に敗北した場合は 409 を返す', async () => {
    // Arrange
    const app = makeApp({
      confirmLobby: vi.fn().mockResolvedValue({ type: 'conflict' }),
    });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ candidateId, memberIds: [memberId1] }),
    });

    // Assert
    expect(response.status).toBe(409);
  });

  it('memberIds が空配列なら 422 を返す（選出は必須）', async () => {
    // Arrange
    const confirmLobby: (
      lobbyId: string,
      userId: string,
      input: unknown,
    ) => Promise<ConfirmLobbyResult> = vi
      .fn()
      .mockResolvedValue({ type: 'ok', gameSession: mockGameSession });
    const app = makeApp({ confirmLobby });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ candidateId, memberIds: [] }),
    });

    // Assert
    expect(response.status).toBe(422);
    expect(confirmLobby).not.toHaveBeenCalled();
  });

  it('memberIds が未指定なら 422 を返す（選出は必須）', async () => {
    // Arrange
    const confirmLobby: (
      lobbyId: string,
      userId: string,
      input: unknown,
    ) => Promise<ConfirmLobbyResult> = vi
      .fn()
      .mockResolvedValue({ type: 'ok', gameSession: mockGameSession });
    const app = makeApp({ confirmLobby });

    // Act
    const response = await app.request('/api/lobbies/lobby-1/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ candidateId }),
    });

    // Assert
    expect(response.status).toBe(422);
    expect(confirmLobby).not.toHaveBeenCalled();
  });

  it('不正な JSON なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{invalid',
    });

    // Assert
    expect(response.status).toBe(400);
  });

  it('candidateId が不正な形式（uuid でない）なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/lobbies/lobby-1/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        candidateId: 'not-a-uuid',
        memberIds: [memberId1],
      }),
    });

    // Assert
    expect(response.status).toBe(400);
  });

  it('ユースケースに lobbyId・userId・input を渡す', async () => {
    // Arrange
    const confirmLobby: (
      lobbyId: string,
      userId: string,
      input: unknown,
    ) => Promise<ConfirmLobbyResult> = vi
      .fn()
      .mockResolvedValue({ type: 'ok', gameSession: mockGameSession });
    const app = makeApp({ confirmLobby });

    // Act
    await app.request('/api/lobbies/lobby-1/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        candidateId,
        memberIds: [memberId1, memberId2],
      }),
    });

    // Assert
    expect(confirmLobby).toHaveBeenCalledWith('lobby-1', 'user-1', {
      candidateId,
      memberIds: [memberId1, memberId2],
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

describe('GET /api/lobbies/:id/availability-dates', () => {
  it('公開済み募集枠は未認証でも 200 で候補日一覧を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates',
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual([mockAvailabilityDate]);
  });

  it('存在しない募集枠なら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      listAvailabilityDates: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/nonexistent/availability-dates',
    );

    // Assert
    expect(response.status).toBe(404);
  });

  it('非公開募集枠にホスト以外がアクセスすると 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      listAvailabilityDates: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates',
    );

    // Assert
    expect(response.status).toBe(403);
  });

  it('非公開募集枠に未認証でアクセスすると 401 を返す', async () => {
    // Arrange
    const app = makeApp({
      getSession: vi.fn().mockResolvedValue(null),
      listAvailabilityDates: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates',
    );

    // Assert
    expect(response.status).toBe(401);
  });

  it('lobbyId と userId を listAvailabilityDates に渡す', async () => {
    // Arrange
    const listAvailabilityDates: (
      lobbyId: string,
      userId: string | null,
    ) => Promise<ListAvailabilityDatesResult> = vi
      .fn()
      .mockResolvedValue({ type: 'ok', dates: [] });
    const app = makeApp({ listAvailabilityDates });

    // Act
    await app.request('/api/lobbies/lobby-1/availability-dates');

    // Assert
    expect(listAvailabilityDates).toHaveBeenCalledWith('lobby-1', 'user-1');
  });
});

describe('POST /api/lobbies/:id/availability-dates', () => {
  it('ホストが有効なボディで追加すると 201 と候補日を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ date: '2099-09-01' }),
      },
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(body).toEqual(mockAvailabilityDate);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ date: '2099-09-01' }),
      },
    );

    // Assert
    expect(response.status).toBe(401);
  });

  it('ホスト以外は 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      addAvailabilityDate: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ date: '2099-09-01' }),
      },
    );

    // Assert
    expect(response.status).toBe(403);
  });

  it('存在しない募集枠なら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      addAvailabilityDate: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/nonexistent/availability-dates',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ date: '2099-09-01' }),
      },
    );

    // Assert
    expect(response.status).toBe(404);
  });

  it('確定済み・中止済みの募集枠は 409 を返す', async () => {
    // Arrange
    const app = makeApp({
      addAvailabilityDate: vi.fn().mockResolvedValue({ type: 'invalidStatus' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ date: '2099-09-01' }),
      },
    );

    // Assert
    expect(response.status).toBe(409);
  });

  it('過去日なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ date: '2000-01-01' }),
      },
    );

    // Assert
    expect(response.status).toBe(400);
  });

  it('ユースケースに lobbyId・userId・input を渡す', async () => {
    // Arrange
    const addAvailabilityDate: (
      lobbyId: string,
      userId: string,
      input: unknown,
    ) => Promise<AddAvailabilityDateResult> = vi
      .fn()
      .mockResolvedValue({ type: 'ok', date: mockAvailabilityDate });
    const app = makeApp({ addAvailabilityDate });

    // Act
    await app.request('/api/lobbies/lobby-1/availability-dates', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ date: '2099-09-01' }),
    });

    // Assert
    expect(addAvailabilityDate).toHaveBeenCalledWith('lobby-1', 'user-1', {
      date: '2099-09-01',
    });
  });
});

describe('PUT /api/lobbies/:id/availability-dates', () => {
  it('ホストが有効なボディで一括更新すると 200 と候補日一覧を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          dates: [{ date: '2099-09-01' }, { date: '2099-09-02' }],
        }),
      },
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual([mockAvailabilityDate]);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dates: [{ date: '2099-09-01' }] }),
      },
    );

    // Assert
    expect(response.status).toBe(401);
  });

  it('ホスト以外は 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      bulkUpdateAvailabilityDates: vi
        .fn()
        .mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dates: [{ date: '2099-09-01' }] }),
      },
    );

    // Assert
    expect(response.status).toBe(403);
  });

  it('存在しない募集枠なら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      bulkUpdateAvailabilityDates: vi
        .fn()
        .mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/nonexistent/availability-dates',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dates: [{ date: '2099-09-01' }] }),
      },
    );

    // Assert
    expect(response.status).toBe(404);
  });

  it('確定済み・中止済みの募集枠は 409 を返す', async () => {
    // Arrange
    const app = makeApp({
      bulkUpdateAvailabilityDates: vi
        .fn()
        .mockResolvedValue({ type: 'invalidStatus' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dates: [{ date: '2099-09-01' }] }),
      },
    );

    // Assert
    expect(response.status).toBe(409);
  });

  it('dates が空配列なら 400 を返す（game-session と異なり 1 件以上が必須）', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dates: [] }),
      },
    );

    // Assert
    expect(response.status).toBe(400);
  });

  it('dateNote が上限を超えると 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          dates: [
            {
              date: '2099-09-01',
              dateNote: 'あ'.repeat(DATE_NOTE_MAX_LENGTH + 1),
            },
          ],
        }),
      },
    );

    // Assert
    expect(response.status).toBe(400);
  });

  it('dateNote 付きの候補日をユースケースへそのまま渡す', async () => {
    // Arrange
    const bulkUpdateAvailabilityDates = vi
      .fn()
      .mockResolvedValue({ type: 'ok', dates: [mockAvailabilityDate] });
    const app = makeApp({ bulkUpdateAvailabilityDates });

    // Act
    await app.request('/api/lobbies/lobby-1/availability-dates', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        dates: [{ date: '2099-09-01', dateNote: '13:00〜17:00' }],
      }),
    });

    // Assert
    expect(bulkUpdateAvailabilityDates).toHaveBeenCalledWith(
      'lobby-1',
      'user-1',
      { dates: [{ date: '2099-09-01', dateNote: '13:00〜17:00' }] },
    );
  });

  it('dates 未指定なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      },
    );

    // Assert
    expect(response.status).toBe(400);
  });

  it('ユースケースに lobbyId・userId・input を渡す', async () => {
    // Arrange
    const bulkUpdateAvailabilityDates: (
      lobbyId: string,
      userId: string,
      input: unknown,
    ) => Promise<BulkUpdateAvailabilityDatesResult> = vi
      .fn()
      .mockResolvedValue({ type: 'ok', dates: [mockAvailabilityDate] });
    const app = makeApp({ bulkUpdateAvailabilityDates });

    // Act
    await app.request('/api/lobbies/lobby-1/availability-dates', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        dates: [{ date: '2099-09-01' }, { date: '2099-09-02' }],
      }),
    });

    // Assert
    expect(bulkUpdateAvailabilityDates).toHaveBeenCalledWith(
      'lobby-1',
      'user-1',
      { dates: [{ date: '2099-09-01' }, { date: '2099-09-02' }] },
    );
  });
});

describe('DELETE /api/lobbies/:id/availability-dates/:dateId', () => {
  it('ホストが削除すると 204 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1',
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
      '/api/lobbies/lobby-1/availability-dates/date-1',
      { method: 'DELETE' },
    );

    // Assert
    expect(response.status).toBe(401);
  });

  it('ホスト以外は 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      deleteAvailabilityDate: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1',
      { method: 'DELETE' },
    );

    // Assert
    expect(response.status).toBe(403);
  });

  it('存在しない候補日なら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      deleteAvailabilityDate: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates/nonexistent',
      { method: 'DELETE' },
    );

    // Assert
    expect(response.status).toBe(404);
  });

  it('確定済み・中止済みの募集枠は 409 を返す', async () => {
    // Arrange
    const app = makeApp({
      deleteAvailabilityDate: vi
        .fn()
        .mockResolvedValue({ type: 'invalidStatus' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1',
      { method: 'DELETE' },
    );

    // Assert
    expect(response.status).toBe(409);
  });

  it('ユースケースに lobbyId・dateId・userId を渡す', async () => {
    // Arrange
    const deleteAvailabilityDate: (
      lobbyId: string,
      dateId: string,
      userId: string,
    ) => Promise<DeleteAvailabilityDateResult> = vi
      .fn()
      .mockResolvedValue({ type: 'ok' });
    const app = makeApp({ deleteAvailabilityDate });

    // Act
    await app.request('/api/lobbies/lobby-1/availability-dates/date-1', {
      method: 'DELETE',
    });

    // Assert
    expect(deleteAvailabilityDate).toHaveBeenCalledWith(
      'lobby-1',
      'date-1',
      'user-1',
    );
  });
});

describe('PUT /api/lobbies/:id/availability-dates/:dateId/responses', () => {
  it('メンバーが自分の回答を登録すると 200 と回答を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1/responses',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answer: 'ok' }),
      },
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockAnswer);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1/responses',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answer: 'ok' }),
      },
    );

    // Assert
    expect(response.status).toBe(401);
  });

  it('募集枠のメンバーでない場合は 403 を返す（本人以外は回答できない）', async () => {
    // Arrange
    const app = makeApp({
      updateAvailabilityDateResponse: vi
        .fn()
        .mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1/responses',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answer: 'ok' }),
      },
    );

    // Assert
    expect(response.status).toBe(403);
  });

  it('存在しない募集枠・候補日なら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateAvailabilityDateResponse: vi
        .fn()
        .mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates/nonexistent/responses',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answer: 'ok' }),
      },
    );

    // Assert
    expect(response.status).toBe(404);
  });

  it('募集枠が draft（公開前）の場合は 422 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateAvailabilityDateResponse: vi
        .fn()
        .mockResolvedValue({ type: 'notPublished' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1/responses',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answer: 'ok' }),
      },
    );

    // Assert
    expect(response.status).toBe(422);
  });

  it('募集枠が確定済み・中止済みの場合は 409 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateAvailabilityDateResponse: vi
        .fn()
        .mockResolvedValue({ type: 'invalidStatus' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1/responses',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answer: 'ok' }),
      },
    );

    // Assert
    expect(response.status).toBe(409);
  });

  it('answer が不正な値なら 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1/responses',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answer: 'invalid' }),
      },
    );

    // Assert
    expect(response.status).toBe(400);
  });

  it('ユースケースに lobbyId・dateId・userId・input を渡す（memberId は本文で受け取らない）', async () => {
    // Arrange
    const updateAvailabilityDateResponse: (
      lobbyId: string,
      dateId: string,
      userId: string,
      input: unknown,
    ) => Promise<UpdateAvailabilityDateResponseResult> = vi
      .fn()
      .mockResolvedValue({ type: 'ok', answer: mockAnswer });
    const app = makeApp({ updateAvailabilityDateResponse });

    // Act
    await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1/responses',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answer: 'maybe', comment: 'たぶん行ける' }),
      },
    );

    // Assert
    expect(updateAvailabilityDateResponse).toHaveBeenCalledWith(
      'lobby-1',
      'date-1',
      'user-1',
      { answer: 'maybe', comment: 'たぶん行ける' },
    );
  });
});

describe('PUT /api/lobbies/:id/availability-dates/:dateId/guest-responses', () => {
  it('有効な Guest-Token とゲストの memberId で回答すると 200 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1/guest-responses',
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'guest-token-abc',
        },
        body: JSON.stringify({
          answer: 'ok',
          memberId: 'aaaaaaaa-0000-4000-8000-000000000001',
        }),
      },
    );
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockAnswer);
  });

  it('認証（セッション）は不要', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1/guest-responses',
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'guest-token-abc',
        },
        body: JSON.stringify({
          answer: 'ok',
          memberId: 'aaaaaaaa-0000-4000-8000-000000000001',
        }),
      },
    );

    // Assert
    expect(response.status).toBe(200);
  });

  it('Guest-Token がない場合は 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateGuestAvailabilityDateResponse: vi
        .fn()
        .mockResolvedValue({ type: 'invalidToken' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1/guest-responses',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          answer: 'ok',
          memberId: 'aaaaaaaa-0000-4000-8000-000000000001',
        }),
      },
    );

    // Assert
    expect(response.status).toBe(403);
  });

  it('Guest-Token が一致しない場合は 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateGuestAvailabilityDateResponse: vi
        .fn()
        .mockResolvedValue({ type: 'invalidToken' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1/guest-responses',
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'wrong-token',
        },
        body: JSON.stringify({
          answer: 'ok',
          memberId: 'aaaaaaaa-0000-4000-8000-000000000001',
        }),
      },
    );

    // Assert
    expect(response.status).toBe(403);
  });

  it('トークンは正しいが memberId がゲストメンバーでない場合は 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateGuestAvailabilityDateResponse: vi
        .fn()
        .mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1/guest-responses',
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'guest-token-abc',
        },
        body: JSON.stringify({
          answer: 'ok',
          memberId: 'aaaaaaaa-0000-4000-8000-000000000099',
        }),
      },
    );

    // Assert
    expect(response.status).toBe(403);
  });

  it('存在しない募集枠・候補日なら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateGuestAvailabilityDateResponse: vi
        .fn()
        .mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/nonexistent/availability-dates/date-1/guest-responses',
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'guest-token-abc',
        },
        body: JSON.stringify({
          answer: 'ok',
          memberId: 'aaaaaaaa-0000-4000-8000-000000000001',
        }),
      },
    );

    // Assert
    expect(response.status).toBe(404);
  });

  it('draft を含め open/scheduling 以外の募集枠は 409 を返す（game-session と異なり 423 は使わない）', async () => {
    // Arrange
    const app = makeApp({
      updateGuestAvailabilityDateResponse: vi
        .fn()
        .mockResolvedValue({ type: 'invalidStatus' }),
    });

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1/guest-responses',
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'guest-token-abc',
        },
        body: JSON.stringify({
          answer: 'ok',
          memberId: 'aaaaaaaa-0000-4000-8000-000000000001',
        }),
      },
    );

    // Assert
    expect(response.status).toBe(409);
  });

  it('memberId が UUID でない場合は 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1/guest-responses',
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'guest-token-abc',
        },
        body: JSON.stringify({ answer: 'ok', memberId: 'not-a-uuid' }),
      },
    );

    // Assert
    expect(response.status).toBe(400);
  });

  it('ユースケースに lobbyId・dateId・token・memberId・input を渡す', async () => {
    // Arrange
    const updateGuestAvailabilityDateResponse: (
      lobbyId: string,
      dateId: string,
      token: string,
      memberId: string,
      input: unknown,
    ) => Promise<UpdateGuestAvailabilityDateResponseResult> = vi
      .fn()
      .mockResolvedValue({ type: 'ok', answer: mockAnswer });
    const app = makeApp({ updateGuestAvailabilityDateResponse });

    // Act
    await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1/guest-responses',
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'guest-token-abc',
        },
        body: JSON.stringify({
          answer: 'maybe',
          comment: 'たぶん行ける',
          memberId: 'aaaaaaaa-0000-4000-8000-000000000001',
        }),
      },
    );

    // Assert
    expect(updateGuestAvailabilityDateResponse).toHaveBeenCalledWith(
      'lobby-1',
      'date-1',
      'guest-token-abc',
      'aaaaaaaa-0000-4000-8000-000000000001',
      { answer: 'maybe', comment: 'たぶん行ける' },
    );
  });

  it('1つのゲストトークンで複数の異なるゲストメンバーの回答を編集できる（調整さん方式）', async () => {
    // Arrange
    // トークンとゲストメンバーの状態を持つ簡易 in-memory 実装で検証する
    const validGuestMemberIds = new Set([
      'aaaaaaaa-0000-4000-8000-000000000001',
      'aaaaaaaa-0000-4000-8000-000000000002',
    ]);
    const answers = new Map<string, LobbyAvailabilityDateAnswer>();
    const updateGuestAvailabilityDateResponse = vi.fn(
      async (
        _lobbyId: string,
        _dateId: string,
        token: string,
        memberId: string,
        input: { answer: 'ok' | 'maybe' | 'ng'; comment?: string },
      ): Promise<UpdateGuestAvailabilityDateResponseResult> => {
        if (token !== 'guest-token-abc') return { type: 'invalidToken' };
        if (!validGuestMemberIds.has(memberId)) return { type: 'forbidden' };
        const answer: LobbyAvailabilityDateAnswer = {
          id: `answer-${memberId}`,
          memberId,
          answer: input.answer,
          comment: input.comment ?? null,
        };
        answers.set(memberId, answer);
        return { type: 'ok', answer };
      },
    );
    const app = makeApp({ updateGuestAvailabilityDateResponse });

    // Act: 同じトークンで2人分のゲスト回答を更新する
    const first = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1/guest-responses',
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'guest-token-abc',
        },
        body: JSON.stringify({
          answer: 'ok',
          memberId: 'aaaaaaaa-0000-4000-8000-000000000001',
        }),
      },
    );
    const second = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1/guest-responses',
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: 'guest-token-abc',
        },
        body: JSON.stringify({
          answer: 'ng',
          memberId: 'aaaaaaaa-0000-4000-8000-000000000002',
        }),
      },
    );

    // Assert
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(answers.get('aaaaaaaa-0000-4000-8000-000000000001')).toMatchObject({
      memberId: 'aaaaaaaa-0000-4000-8000-000000000001',
      answer: 'ok',
    });
    expect(answers.get('aaaaaaaa-0000-4000-8000-000000000002')).toMatchObject({
      memberId: 'aaaaaaaa-0000-4000-8000-000000000002',
      answer: 'ng',
    });
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
    expect(published.isPublished).toBe(true);
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
    const guestMembers = new Map<string, LobbyMember>();
    let nextMemberId = 1;
    const answers = new Map<string, LobbyAvailabilityDateAnswer>();

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
        const member: LobbyMember = {
          id: `aaaaaaaa-0000-4000-8000-00000000000${nextMemberId++}`,
          userId: null,
          userName: null,
          guestName: input.guestName,
          joinedAt: '2025-01-01T00:00:00.000Z',
        };
        guestMembers.set(member.id, member);
        return { type: 'ok', member };
      },
    );

    const updateGuestAvailabilityDateResponse = vi.fn(
      async (
        _lobbyId: string,
        _dateId: string,
        token: string,
        memberId: string,
        input: { answer: 'ok' | 'maybe' | 'ng'; comment?: string },
      ): Promise<UpdateGuestAvailabilityDateResponseResult> => {
        if (token !== guestLinkToken) return { type: 'invalidToken' };
        if (!guestMembers.has(memberId)) return { type: 'forbidden' };
        const answer: LobbyAvailabilityDateAnswer = {
          id: `answer-${memberId}`,
          memberId,
          answer: input.answer,
          comment: input.comment ?? null,
        };
        answers.set(memberId, answer);
        return { type: 'ok', answer };
      },
    );

    const app = makeApp({
      getSession: vi.fn().mockResolvedValue(mockSession),
      getGuestLink,
      joinAsGuest,
      updateGuestAvailabilityDateResponse,
    });

    // Act 1: ホストがゲストリンクを発行する
    const guestLinkRes = await app.request('/api/lobbies/lobby-1/guest-link');
    const { token } = (await guestLinkRes.json()) as { token: string };

    // Act 2: 発行されたトークンでゲストが参加する
    const joinRes = await app.request('/api/lobbies/lobby-1/guest-members', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [GUEST_TOKEN_HEADER]: token,
      },
      body: JSON.stringify({ guestName: 'ゲスト花子' }),
    });
    const joinedMember = (await joinRes.json()) as LobbyMember;

    // Act 3: 参加したゲストとして日程回答する
    const responseRes = await app.request(
      '/api/lobbies/lobby-1/availability-dates/date-1/guest-responses',
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          [GUEST_TOKEN_HEADER]: token,
        },
        body: JSON.stringify({
          answer: 'ok',
          comment: '参加します',
          memberId: joinedMember.id,
        }),
      },
    );
    const answer = (await responseRes.json()) as LobbyAvailabilityDateAnswer;

    // Assert
    expect(guestLinkRes.status).toBe(200);
    expect(token).toBe(guestLinkToken);
    expect(joinRes.status).toBe(201);
    expect(joinedMember.guestName).toBe('ゲスト花子');
    expect(joinedMember.userId).toBeNull();
    expect(responseRes.status).toBe(200);
    expect(answer.memberId).toBe(joinedMember.id);
    expect(answer.answer).toBe('ok');
    expect(answers.get(joinedMember.id)).toMatchObject({
      memberId: joinedMember.id,
      answer: 'ok',
      comment: '参加します',
    });
  });
});
