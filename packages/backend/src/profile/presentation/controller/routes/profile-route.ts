import type { Hono } from 'hono';
import type { UpdateProfileInput } from '@taku-biyori/shared';
import { UpdateProfileInputSchema } from '@taku-biyori/shared';
import type { GetProfileResult } from '@/profile/application/get-profile';
import type { UpdateProfileResult } from '@/profile/application/update-profile';

export interface RegisterProfileRouteOptions {
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  getProfile: (userId: string) => Promise<GetProfileResult>;
  updateProfile: (
    userId: string,
    input: UpdateProfileInput,
  ) => Promise<UpdateProfileResult>;
}

export const registerProfileRoute = (
  app: Hono,
  options: RegisterProfileRouteOptions,
): void => {
  app.get('/api/profile', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await options.getProfile(authSession.user.id);
    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    return c.json(result.profile);
  });

  app.patch('/api/profile', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = UpdateProfileInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Bad Request' }, 400);
    }

    const result = await options.updateProfile(
      authSession.user.id,
      parsed.data,
    );
    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    return c.json(result.profile);
  });
};
