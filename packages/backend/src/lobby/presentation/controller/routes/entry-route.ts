import type { Hono } from 'hono';
import type {
  LobbyMember,
  JoinLobbyAsGuestInput,
  JoinLobbyInput,
} from '@taku-biyori/shared';
import {
  GUEST_TOKEN_HEADER,
  JoinLobbyAsGuestInputSchema,
  JoinLobbyInputSchema,
} from '@taku-biyori/shared';
import type { ListMembersResult } from '@/lobby/application/list-members';
import type { JoinLobbyResult } from '@/lobby/application/join-lobby';
import type { JoinAsGuestResult } from '@/lobby/application/join-as-guest';
import type { LeaveLobbyResult } from '@/lobby/application/leave-lobby';

export interface RegisterMemberRouteOptions {
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  listMembers: (
    lobbyId: string,
    userId: string | null,
  ) => Promise<ListMembersResult>;
  joinLobby: (
    lobbyId: string,
    userId: string,
    input: JoinLobbyInput,
  ) => Promise<JoinLobbyResult>;
  joinAsGuest: (
    lobbyId: string,
    token: string,
    input: JoinLobbyAsGuestInput,
  ) => Promise<JoinAsGuestResult>;
  leaveLobby: (
    lobbyId: string,
    memberId: string,
    userId: string,
  ) => Promise<LeaveLobbyResult>;
}

export const registerMemberRoute = (
  app: Hono,
  options: RegisterMemberRouteOptions,
): void => {
  app.get('/api/lobbies/:id/members', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    const userId = authSession?.user.id ?? null;

    const result = await options.listMembers(c.req.param('id'), userId);

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') {
      return userId === null
        ? c.json({ error: 'Unauthorized' }, 401)
        : c.json({ error: 'Forbidden' }, 403);
    }
    return c.json(result.members satisfies LobbyMember[]);
  });

  app.post('/api/lobbies/:id/members', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = JoinLobbyInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const result = await options.joinLobby(
      c.req.param('id'),
      authSession.user.id,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    // lobbyNotOpen を alreadyJoined より先にチェックする。
    // 募集枠が open でない場合でも alreadyJoined (409) を返すのは不適切なため、
    // ステータス不一致を先に検出して 422 を返す（game-session の member-route と同方針）。
    if (result.type === 'lobbyNotOpen') {
      return c.json({ error: 'Lobby is not open for joining' }, 422);
    }
    if (result.type === 'alreadyJoined') {
      return c.json({ error: 'Already joined' }, 409);
    }
    return c.json(result.member satisfies LobbyMember, 201);
  });

  // ゲスト参加は完全匿名。認証は不要で、Guest-Token ヘッダーで認可する。
  app.post('/api/lobbies/:id/guest-members', async (c) => {
    const token = c.req.header(GUEST_TOKEN_HEADER) ?? '';

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = JoinLobbyAsGuestInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const result = await options.joinAsGuest(
      c.req.param('id'),
      token,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'invalidToken') {
      return c.json({ error: 'Invalid guest token' }, 403);
    }
    if (result.type === 'lobbyNotOpen') {
      return c.json({ error: 'Lobby is not open for joining' }, 422);
    }
    return c.json(result.member satisfies LobbyMember, 201);
  });

  app.delete('/api/lobbies/:id/members/:memberId', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    const result = await options.leaveLobby(
      c.req.param('id'),
      c.req.param('memberId'),
      authSession.user.id,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'hostCannotLeave') {
      return c.json({ error: 'Host cannot leave the lobby' }, 422);
    }
    if (result.type === 'invalidStatus') {
      return c.json({ error: 'Cannot leave lobby in this status' }, 409);
    }
    return new Response(null, { status: 204 });
  });
};
