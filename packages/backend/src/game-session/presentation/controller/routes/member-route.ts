import type { Hono } from 'hono';
import type {
  GameSessionMember,
  JoinAsGuestInput,
  JoinGameSessionInput,
  UpdateMemberInput,
} from '@taku-biyori/shared';
import {
  JoinAsGuestInputSchema,
  JoinGameSessionInputSchema,
  UpdateMemberInputSchema,
} from '@taku-biyori/shared';
import type { ListMembersResult } from '@/game-session/application/list-members';
import type { JoinGameSessionResult } from '@/game-session/application/join-game-session';
import type { JoinAsGuestResult } from '@/game-session/application/join-as-guest';
import type { UpdateMemberResult } from '@/game-session/application/update-member';
import type { LeaveGameSessionResult } from '@/game-session/application/leave-game-session';

export interface RegisterMemberRouteOptions {
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  listMembers: (gameSessionId: string) => Promise<ListMembersResult>;
  joinGameSession: (
    gameSessionId: string,
    userId: string,
    input: JoinGameSessionInput,
  ) => Promise<JoinGameSessionResult>;
  joinAsGuest: (
    gameSessionId: string,
    input: JoinAsGuestInput,
  ) => Promise<JoinAsGuestResult>;
  updateMember: (
    gameSessionId: string,
    memberId: string,
    userId: string,
    input: UpdateMemberInput,
  ) => Promise<UpdateMemberResult>;
  leaveGameSession: (
    gameSessionId: string,
    memberId: string,
    userId: string,
  ) => Promise<LeaveGameSessionResult>;
}

export const registerMemberRoute = (
  app: Hono,
  options: RegisterMemberRouteOptions,
): void => {
  app.get('/api/game-sessions/:id/members', async (c) => {
    const result = await options.listMembers(c.req.param('id'));
    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    return c.json(result.members satisfies GameSessionMember[]);
  });

  app.post('/api/game-sessions/:id/members', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = JoinGameSessionInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const result = await options.joinGameSession(
      c.req.param('id'),
      authSession.user.id,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    // sessionNotOpen を alreadyJoined より先にチェックする。
    // セッションが非公開の場合でも alreadyJoined (409) を返すのは不適切なため、
    // ステータス不一致を先に検出して 422 を返す。
    if (result.type === 'sessionNotOpen') {
      return c.json({ error: 'Session is not open for joining' }, 422);
    }
    if (result.type === 'alreadyJoined') {
      return c.json({ error: 'Already joined' }, 409);
    }
    return c.json(result.member satisfies GameSessionMember, 201);
  });

  app.post('/api/game-sessions/:id/guest-members', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = JoinAsGuestInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const result = await options.joinAsGuest(c.req.param('id'), parsed.data);

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    return c.json(result.member satisfies GameSessionMember, 201);
  });

  app.patch('/api/game-sessions/:id/members/:memberId', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = UpdateMemberInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const result = await options.updateMember(
      c.req.param('id'),
      c.req.param('memberId'),
      authSession.user.id,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json(result.member satisfies GameSessionMember);
  });

  app.delete('/api/game-sessions/:id/members/:memberId', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    const result = await options.leaveGameSession(
      c.req.param('id'),
      c.req.param('memberId'),
      authSession.user.id,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'hostCannotLeave') {
      return c.json({ error: 'Host cannot leave the session' }, 422);
    }
    if (result.type === 'sessionNotOpen') {
      return c.json({ error: 'Session is not open for leaving' }, 422);
    }
    return new Response(null, { status: 204 });
  });
};
