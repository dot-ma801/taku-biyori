import type { Hono } from 'hono';
import type {
  GameSessionMember,
  GameSessionMemberLinkRequest,
} from '@taku-biyori/shared';
import type { RequestMemberLinkResult } from '@/game-session/application/request-member-link';
import type { ListMemberLinkRequestsResult } from '@/game-session/application/list-member-link-requests';
import type { ApproveMemberLinkResult } from '@/game-session/application/approve-member-link';
import type { DeleteMemberLinkRequestResult } from '@/game-session/application/delete-member-link-request';

export interface RegisterMemberLinkRouteOptions {
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  requestMemberLink: (
    gameSessionId: string,
    memberId: string,
    userId: string,
  ) => Promise<RequestMemberLinkResult>;
  listMemberLinkRequests: (
    gameSessionId: string,
    userId: string,
  ) => Promise<ListMemberLinkRequestsResult>;
  approveMemberLink: (
    gameSessionId: string,
    requestId: string,
    userId: string,
  ) => Promise<ApproveMemberLinkResult>;
  deleteMemberLinkRequest: (
    gameSessionId: string,
    requestId: string,
    userId: string,
  ) => Promise<DeleteMemberLinkRequestResult>;
}

/**
 * ゲスト参加をアカウントへ紐づけるための申請・承認ルート（ADR 0008）。
 *
 * 申請は認証のみを要求し `Guest-Token` は求めない。ゲストリンクは認証の往復で
 * 失われるうえ、卓ごとの共有トークンなので本人性を証明しないため。
 */
export const registerMemberLinkRoute = (
  app: Hono,
  options: RegisterMemberLinkRouteOptions,
): void => {
  app.post(
    '/api/game-sessions/:id/members/:memberId/link-requests',
    async (c) => {
      const authSession = await options.getSession(c.req.raw.headers);
      if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

      const result = await options.requestMemberLink(
        c.req.param('id'),
        c.req.param('memberId'),
        authSession.user.id,
      );

      if (result.type === 'notFound')
        return c.json({ error: 'Not Found' }, 404);
      if (result.type === 'forbidden')
        return c.json({ error: 'Forbidden' }, 403);
      if (result.type === 'notGuestMember') {
        return c.json({ error: 'Member is not a guest' }, 403);
      }
      if (result.type === 'alreadyMember') {
        return c.json({ error: 'Already joined this game session' }, 409);
      }
      if (result.type === 'alreadyRequested') {
        return c.json({ error: 'Already requested' }, 409);
      }
      return c.json(result.request satisfies GameSessionMemberLinkRequest, 201);
    },
  );

  app.get('/api/game-sessions/:id/member-link-requests', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    const result = await options.listMemberLinkRequests(
      c.req.param('id'),
      authSession.user.id,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json(result.requests satisfies GameSessionMemberLinkRequest[]);
  });

  app.post(
    '/api/game-sessions/:id/member-link-requests/:requestId/approve',
    async (c) => {
      const authSession = await options.getSession(c.req.raw.headers);
      if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

      const result = await options.approveMemberLink(
        c.req.param('id'),
        c.req.param('requestId'),
        authSession.user.id,
      );

      if (result.type === 'notFound')
        return c.json({ error: 'Not Found' }, 404);
      if (result.type === 'forbidden')
        return c.json({ error: 'Forbidden' }, 403);
      if (result.type === 'conflict') {
        return c.json(
          { error: 'The user already joined this game session as a member' },
          409,
        );
      }
      return c.json(result.member satisfies GameSessionMember);
    },
  );

  app.delete(
    '/api/game-sessions/:id/member-link-requests/:requestId',
    async (c) => {
      const authSession = await options.getSession(c.req.raw.headers);
      if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

      const result = await options.deleteMemberLinkRequest(
        c.req.param('id'),
        c.req.param('requestId'),
        authSession.user.id,
      );

      if (result.type === 'notFound')
        return c.json({ error: 'Not Found' }, 404);
      if (result.type === 'forbidden')
        return c.json({ error: 'Forbidden' }, 403);
      return new Response(null, { status: 204 });
    },
  );
};
