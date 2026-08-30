import type { Hono } from 'hono';
import type { GetGuestLinkResult } from '@/lobby/application/get-guest-link';
import type { RegenerateGuestLinkResult } from '@/lobby/application/regenerate-guest-link';

export interface RegisterGuestLinkRouteOptions {
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  getGuestLink: (id: string, userId: string) => Promise<GetGuestLinkResult>;
  regenerateGuestLink: (
    id: string,
    userId: string,
  ) => Promise<RegenerateGuestLinkResult>;
}

export const registerGuestLinkRoute = (
  app: Hono,
  options: RegisterGuestLinkRouteOptions,
): void => {
  app.get('/api/lobbies/:id/guest-link', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await options.getGuestLink(
      c.req.param('id'),
      authSession.user.id,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ token: result.token });
  });

  // トークンの再発行。新しいリソースを作るわけではない（ロビーの属性の置き換え）ため
  // 201 ではなく 200 を返す（design-v2 §6-12-1）
  app.post('/api/lobbies/:id/guest-link', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await options.regenerateGuestLink(
      c.req.param('id'),
      authSession.user.id,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'invalidStatus') {
      return c.json({ error: 'Cannot regenerate token in this status' }, 422);
    }
    return c.json({ token: result.token });
  });
};
