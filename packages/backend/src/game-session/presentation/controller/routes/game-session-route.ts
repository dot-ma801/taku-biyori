import type { Hono } from 'hono';
import type {
  GameSession,
  GameSessionDetail,
  GameSessionListItem,
  CreateGameSessionInput,
  UpdateGameSessionInput,
} from '@taku-biyori/shared';
import {
  CreateGameSessionInputSchema,
  UpdateGameSessionInputSchema,
} from '@taku-biyori/shared';
import type { UpdateGameSessionResult } from '@/game-session/application/update-game-session';
import type { DeleteGameSessionResult } from '@/game-session/application/delete-game-session';

export interface RegisterGameSessionRouteOptions {
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  listGameSessions: (userId: string) => Promise<GameSessionListItem[]>;
  createGameSession: (
    userId: string,
    input: CreateGameSessionInput,
  ) => Promise<GameSession>;
  getGameSession: (id: string) => Promise<GameSessionDetail | null>;
  updateGameSession: (
    id: string,
    userId: string,
    input: UpdateGameSessionInput,
  ) => Promise<UpdateGameSessionResult>;
  deleteGameSession: (
    id: string,
    userId: string,
  ) => Promise<DeleteGameSessionResult>;
}

export const registerGameSessionRoute = (
  app: Hono,
  options: RegisterGameSessionRouteOptions,
): void => {
  app.get('/api/game-sessions', async (c) => {
    const session = await options.getSession(c.req.raw.headers);
    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const sessions = await options.listGameSessions(session.user.id);
    return c.json(sessions);
  });

  app.post('/api/game-sessions', async (c) => {
    const session = await options.getSession(c.req.raw.headers);
    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = CreateGameSessionInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const gameSession = await options.createGameSession(
      session.user.id,
      parsed.data,
    );
    return c.json(gameSession, 201);
  });

  app.get('/api/game-sessions/:id', async (c) => {
    const session = await options.getSession(c.req.raw.headers);
    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const detail = await options.getGameSession(c.req.param('id'));
    if (!detail) {
      return c.json({ error: 'Not Found' }, 404);
    }

    if (!detail.isPublished && detail.createdBy !== session.user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    return c.json(detail);
  });

  app.patch('/api/game-sessions/:id', async (c) => {
    const session = await options.getSession(c.req.raw.headers);
    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = UpdateGameSessionInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const result = await options.updateGameSession(
      c.req.param('id'),
      session.user.id,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json(result.gameSession);
  });

  app.delete('/api/game-sessions/:id', async (c) => {
    const session = await options.getSession(c.req.raw.headers);
    if (!session) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await options.deleteGameSession(
      c.req.param('id'),
      session.user.id,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    return new Response(null, { status: 204 });
  });
};
