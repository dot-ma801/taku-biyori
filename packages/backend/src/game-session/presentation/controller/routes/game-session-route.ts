import type { Hono } from 'hono';
import type { GameSession, GameSessionListItem, CreateGameSessionInput } from '@taku-biyori/shared';
import { CreateGameSessionInputSchema } from '@taku-biyori/shared';

export interface RegisterGameSessionRouteOptions {
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  listGameSessions: (userId: string) => Promise<GameSessionListItem[]>;
  createGameSession: (userId: string, input: CreateGameSessionInput) => Promise<GameSession>;
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

    const gameSession = await options.createGameSession(session.user.id, parsed.data);
    return c.json(gameSession, 201);
  });
};
