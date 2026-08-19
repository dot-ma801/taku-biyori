import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@/app/presentation/controller/create-app';
import type { GameSessionUseCases } from '@/game-session/application/use-cases';
import type { LobbyUseCases } from '@/lobby/application/use-cases';
import type { ProfileUseCases } from '@/profile/application/use-cases';
import type {
  GameSessionMember,
  GameSessionMemberLinkRequest,
  LobbyMember,
  LobbyMemberLinkRequest,
} from '@taku-biyori/shared';
import { GUEST_TOKEN_HEADER } from '@taku-biyori/shared';

const mockSession = { user: { id: 'user-1' } };

const LOBBY_ID = 'f2b4dbb8-0000-4000-8000-000000000001';
const GAME_SESSION_ID = 'f2b4dbb8-0000-4000-8000-000000000002';
const MEMBER_ID = 'f2b4dbb8-0000-4000-8000-000000000010';
const REQUEST_ID = 'f2b4dbb8-0000-4000-8000-000000000020';

const mockLobbyRequest: LobbyMemberLinkRequest = {
  id: REQUEST_ID,
  memberId: MEMBER_ID,
  memberGuestName: 'ゲスト太郎',
  requestedUserId: 'user-1',
  requestedUserName: 'たろう',
  createdAt: '2025-01-01T00:00:00.000Z',
};

const mockLinkedLobbyMember: LobbyMember = {
  id: MEMBER_ID,
  userId: 'user-1',
  userName: 'たろう',
  guestName: 'ゲスト太郎',
  joinedAt: '2025-01-01T00:00:00.000Z',
};

const mockGameSessionRequest: GameSessionMemberLinkRequest = {
  ...mockLobbyRequest,
};

const mockLinkedGameSessionMember: GameSessionMember = {
  ...mockLinkedLobbyMember,
  characterName: null,
  lobbyMemberId: null,
};

type LinkUseCases = Pick<
  LobbyUseCases,
  | 'requestMemberLink'
  | 'listMemberLinkRequests'
  | 'approveMemberLink'
  | 'deleteMemberLinkRequest'
>;

const makeApp = (
  overrides: Partial<LinkUseCases> & {
    getSession?: () => Promise<typeof mockSession | null>;
  } = {},
) => {
  const link = {
    requestMemberLink:
      overrides.requestMemberLink ??
      vi.fn().mockResolvedValue({ type: 'ok', request: mockLobbyRequest }),
    listMemberLinkRequests:
      overrides.listMemberLinkRequests ??
      vi.fn().mockResolvedValue({ type: 'ok', requests: [mockLobbyRequest] }),
    approveMemberLink:
      overrides.approveMemberLink ??
      vi.fn().mockResolvedValue({ type: 'ok', member: mockLinkedLobbyMember }),
    deleteMemberLinkRequest:
      overrides.deleteMemberLinkRequest ??
      vi.fn().mockResolvedValue({ type: 'ok' }),
  };

  return createApp({
    frontendOrigin: 'http://localhost:5173',
    authHandler: vi.fn(async () => new Response('ok')),
    getSession: overrides.getSession ?? vi.fn().mockResolvedValue(mockSession),
    gameSession: link as unknown as GameSessionUseCases,
    profile: {} as unknown as ProfileUseCases,
    lobby: link as unknown as LobbyUseCases,
  });
};

const requestPath = `/api/lobbies/${LOBBY_ID}/members/${MEMBER_ID}/link-requests`;
const listPath = `/api/lobbies/${LOBBY_ID}/member-link-requests`;
const approvePath = `/api/lobbies/${LOBBY_ID}/member-link-requests/${REQUEST_ID}/approve`;
const deletePath = `/api/lobbies/${LOBBY_ID}/member-link-requests/${REQUEST_ID}`;

describe('POST /api/lobbies/:id/members/:memberId/link-requests', () => {
  it('認証済みなら 201 で申請を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(requestPath, { method: 'POST' });

    // Assert
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(mockLobbyRequest);
  });

  it('未認証は 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request(requestPath, { method: 'POST' });

    // Assert
    expect(response.status).toBe(401);
  });

  it('ゲストトークンがなくても申請できる（認証の往復でトークンが失われるため）', async () => {
    // Arrange
    const requestMemberLink = vi
      .fn()
      .mockResolvedValue({ type: 'ok', request: mockLobbyRequest });
    const app = makeApp({ requestMemberLink });

    // Act
    const response = await app.request(requestPath, { method: 'POST' });

    // Assert
    expect(response.status).toBe(201);
    // トークンはユースケースへ渡されない（引数は募集枠・メンバー・ユーザーのみ）
    expect(requestMemberLink).toHaveBeenCalledWith(
      LOBBY_ID,
      MEMBER_ID,
      'user-1',
    );
  });

  it('ゲストトークンを付けても挙動は変わらない', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(requestPath, {
      method: 'POST',
      headers: { [GUEST_TOKEN_HEADER]: 'guest-token-abc' },
    });

    // Assert
    expect(response.status).toBe(201);
  });

  it('存在しない募集枠は 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      requestMemberLink: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request(requestPath, { method: 'POST' });

    // Assert
    expect(response.status).toBe(404);
  });

  it('非公開の募集枠は 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      requestMemberLink: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request(requestPath, { method: 'POST' });

    // Assert
    expect(response.status).toBe(403);
  });

  it('ゲスト行でないメンバーへの申請は 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      requestMemberLink: vi.fn().mockResolvedValue({ type: 'notGuestMember' }),
    });

    // Act
    const response = await app.request(requestPath, { method: 'POST' });

    // Assert
    expect(response.status).toBe(403);
  });

  it('既に参加済みのユーザーは 409 を返す', async () => {
    // Arrange
    const app = makeApp({
      requestMemberLink: vi.fn().mockResolvedValue({ type: 'alreadyMember' }),
    });

    // Act
    const response = await app.request(requestPath, { method: 'POST' });

    // Assert
    expect(response.status).toBe(409);
  });

  it('重複申請は 409 を返す', async () => {
    // Arrange
    const app = makeApp({
      requestMemberLink: vi
        .fn()
        .mockResolvedValue({ type: 'alreadyRequested' }),
    });

    // Act
    const response = await app.request(requestPath, { method: 'POST' });

    // Assert
    expect(response.status).toBe(409);
  });
});

describe('GET /api/lobbies/:id/member-link-requests', () => {
  it('ホストなら 200 で申請一覧を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(listPath);

    // Assert
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([mockLobbyRequest]);
  });

  it('未認証は 401 を返す', async () => {
    // Arrange
    const app = makeApp({ getSession: vi.fn().mockResolvedValue(null) });

    // Act
    const response = await app.request(listPath);

    // Assert
    expect(response.status).toBe(401);
  });

  it('ホスト以外は 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      listMemberLinkRequests: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request(listPath);

    // Assert
    expect(response.status).toBe(403);
  });
});

describe('POST /api/lobbies/:id/member-link-requests/:requestId/approve', () => {
  it('ホストの承認は 200 で紐づけ後のメンバーを返す', async () => {
    // Arrange
    const approveMemberLink = vi
      .fn()
      .mockResolvedValue({ type: 'ok', member: mockLinkedLobbyMember });
    const app = makeApp({ approveMemberLink });

    // Act
    const response = await app.request(approvePath, { method: 'POST' });

    // Assert
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(mockLinkedLobbyMember);
    expect(approveMemberLink).toHaveBeenCalledWith(
      LOBBY_ID,
      REQUEST_ID,
      'user-1',
    );
  });

  it('ホスト以外は 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      approveMemberLink: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request(approvePath, { method: 'POST' });

    // Assert
    expect(response.status).toBe(403);
  });

  it('一意制約に衝突する承認は 409 を返す', async () => {
    // Arrange
    const app = makeApp({
      approveMemberLink: vi.fn().mockResolvedValue({ type: 'conflict' }),
    });

    // Act
    const response = await app.request(approvePath, { method: 'POST' });

    // Assert
    expect(response.status).toBe(409);
  });

  it('存在しない申請IDは 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      approveMemberLink: vi.fn().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request(approvePath, { method: 'POST' });

    // Assert
    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/lobbies/:id/member-link-requests/:requestId', () => {
  it('却下・取り下げは 204 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request(deletePath, { method: 'DELETE' });

    // Assert
    expect(response.status).toBe(204);
  });

  it('ホストでも申請者でもない場合は 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      deleteMemberLinkRequest: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request(deletePath, { method: 'DELETE' });

    // Assert
    expect(response.status).toBe(403);
  });
});

describe('卓（game-session）側の紐づけルート', () => {
  it('申請は 201 を返す', async () => {
    // Arrange
    const requestMemberLink = vi
      .fn()
      .mockResolvedValue({ type: 'ok', request: mockGameSessionRequest });
    const app = makeApp({ requestMemberLink });

    // Act
    const response = await app.request(
      `/api/game-sessions/${GAME_SESSION_ID}/members/${MEMBER_ID}/link-requests`,
      { method: 'POST' },
    );

    // Assert
    expect(response.status).toBe(201);
    expect(requestMemberLink).toHaveBeenCalledWith(
      GAME_SESSION_ID,
      MEMBER_ID,
      'user-1',
    );
  });

  it('ホストの承認は 200 で紐づけ後のメンバーを返す', async () => {
    // Arrange
    const app = makeApp({
      approveMemberLink: vi
        .fn()
        .mockResolvedValue({ type: 'ok', member: mockLinkedGameSessionMember }),
    });

    // Act
    const response = await app.request(
      `/api/game-sessions/${GAME_SESSION_ID}/member-link-requests/${REQUEST_ID}/approve`,
      { method: 'POST' },
    );

    // Assert
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(mockLinkedGameSessionMember);
  });

  it('申請一覧はホスト以外に 403 を返す', async () => {
    // Arrange
    const app = makeApp({
      listMemberLinkRequests: vi.fn().mockResolvedValue({ type: 'forbidden' }),
    });

    // Act
    const response = await app.request(
      `/api/game-sessions/${GAME_SESSION_ID}/member-link-requests`,
    );

    // Assert
    expect(response.status).toBe(403);
  });
});
