import type { Hono } from 'hono';
import type { UpsertGameSessionPlayMemoInput } from '@taku-biyori/shared';
import { UpsertGameSessionPlayMemoInputSchema } from '@taku-biyori/shared';
import type { GetMyPlayMemoResult } from '@/game-session/application/get-my-play-memo';
import type { UpsertMyPlayMemoResult } from '@/game-session/application/upsert-my-play-memo';

export interface RegisterPlayMemoRouteOptions {
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  getMyPlayMemo: (
    gameSessionId: string,
    userId: string,
  ) => Promise<GetMyPlayMemoResult>;
  upsertMyPlayMemo: (
    gameSessionId: string,
    userId: string,
    input: UpsertGameSessionPlayMemoInput,
  ) => Promise<UpsertMyPlayMemoResult>;
}

export const registerPlayMemoRoute = (
  app: Hono,
  options: RegisterPlayMemoRouteOptions,
): void => {
  app.get('/api/game-sessions/:id/play-memos/me', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    const result = await options.getMyPlayMemo(
      c.req.param('id'),
      authSession.user.id,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json(result.playMemo);
  });

  app.put('/api/game-sessions/:id/play-memos/me', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = UpsertGameSessionPlayMemoInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const result = await options.upsertMyPlayMemo(
      c.req.param('id'),
      authSession.user.id,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    // 確定後ロックのエラーコードは 409 に統一する（423 は使わない。design-v1.2 §8）
    if (result.type === 'statusLocked') {
      return c.json({ error: 'Cannot edit play memo in this status' }, 409);
    }
    return c.json(result.playMemo);
  });
};
