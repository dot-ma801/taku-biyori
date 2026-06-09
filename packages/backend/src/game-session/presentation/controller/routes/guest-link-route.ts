import type { Hono } from 'hono';
import type { GetGuestLinkResult } from '@/game-session/application/get-guest-link';
import type { GetGuestLinkPreviewResult } from '@/game-session/application/get-guest-link-preview';

export interface RegisterGuestLinkRouteOptions {
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  getGuestLink: (id: string, userId: string) => Promise<GetGuestLinkResult>;
  getGuestLinkPreview: (token: string) => Promise<GetGuestLinkPreviewResult>;
}

export const registerGuestLinkRoute = (
  app: Hono,
  options: RegisterGuestLinkRouteOptions,
): void => {
  app.get('/api/game-sessions/:id/guest-link', async (c) => {
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

  app.get('/join/:token', async (c) => {
    const result = await options.getGuestLinkPreview(c.req.param('token'));

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    return c.json(result.gameSession);
  });
};
