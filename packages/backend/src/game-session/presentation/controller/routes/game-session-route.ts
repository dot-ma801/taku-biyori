import type { Hono } from 'hono';
import type {
  CreateGameSessionInput,
  GameSessionListItem,
  UpdateGameSessionInput,
  UpdateGameSessionStatusInput,
} from '@taku-biyori/shared';
import {
  CreateGameSessionInputSchema,
  UpdateGameSessionInputSchema,
  UpdateGameSessionStatusInputSchema,
} from '@taku-biyori/shared';
import type { ListLobbyGameSessionsResult } from '@/game-session/application/list-lobby-game-sessions';
import type { GetGameSessionResult } from '@/game-session/application/get-game-session';
import type { CreateGameSessionResult } from '@/game-session/application/create-game-session';
import type { UpdateGameSessionResult } from '@/game-session/application/update-game-session';
import type { DeleteGameSessionResult } from '@/game-session/application/delete-game-session';
import type { UpdateGameSessionStatusResult } from '@/game-session/application/update-game-session-status';

export interface RegisterGameSessionRouteOptions {
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  listGameSessions: (userId: string) => Promise<GameSessionListItem[]>;
  listLobbyGameSessions: (
    lobbyId: string,
    userId: string | null,
  ) => Promise<ListLobbyGameSessionsResult>;
  getGameSession: (
    lobbyId: string,
    id: string,
    userId: string | null,
  ) => Promise<GetGameSessionResult>;
  createGameSession: (
    lobbyId: string,
    userId: string,
    input: CreateGameSessionInput,
  ) => Promise<CreateGameSessionResult>;
  updateGameSession: (
    lobbyId: string,
    id: string,
    userId: string,
    input: UpdateGameSessionInput,
  ) => Promise<UpdateGameSessionResult>;
  deleteGameSession: (
    lobbyId: string,
    id: string,
    userId: string,
  ) => Promise<DeleteGameSessionResult>;
  updateGameSessionStatus: (
    lobbyId: string,
    id: string,
    userId: string,
    input: UpdateGameSessionStatusInput,
  ) => Promise<UpdateGameSessionStatusResult>;
}

/**
 * セッションのルート（design-v2 §6-5）。
 *
 * パスはすべてロビー配下に入れ子にする。例外は横断一覧の `GET /api/me/game-sessions` だけで、
 * 複数のロビーをまたぐため親を持てない。
 *
 * 入れ子の代償として「URL の :lobbyId がセッションの実際の lobby_id と一致するか」の
 * 検証が要る。検証漏れが起きないよう、各ユースケースが lobbyId を必須引数で受け取り、
 * 不一致を 404 に倒す形にしてある。
 */
export const registerGameSessionRoute = (
  app: Hono,
  options: RegisterGameSessionRouteOptions,
): void => {
  app.get('/api/me/game-sessions', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    const gameSessions = await options.listGameSessions(authSession.user.id);
    return c.json(gameSessions);
  });

  app.get('/api/lobbies/:lobbyId/game-sessions', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    const userId = authSession?.user.id ?? null;

    const result = await options.listLobbyGameSessions(
      c.req.param('lobbyId'),
      userId,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') {
      return userId === null
        ? c.json({ error: 'Unauthorized' }, 401)
        : c.json({ error: 'Forbidden' }, 403);
    }
    return c.json(result.gameSessions);
  });

  app.post('/api/lobbies/:lobbyId/game-sessions', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = CreateGameSessionInputSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const result = await options.createGameSession(
      c.req.param('lobbyId'),
      authSession.user.id,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'invalidStatus') {
      return c.json({ error: 'Lobby is disbanded' }, 422);
    }
    if (result.type === 'invalidEntries') {
      return c.json(
        {
          error: 'entryIds contains an entry that is not active in this lobby',
        },
        422,
      );
    }
    if (result.type === 'pastScheduledAt') {
      return c.json({ error: 'scheduledAt must be today or later' }, 422);
    }
    return c.json(result.gameSession, 201);
  });

  app.get('/api/lobbies/:lobbyId/game-sessions/:id', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    const userId = authSession?.user.id ?? null;

    const result = await options.getGameSession(
      c.req.param('lobbyId'),
      c.req.param('id'),
      userId,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') {
      return userId === null
        ? c.json({ error: 'Unauthorized' }, 401)
        : c.json({ error: 'Forbidden' }, 403);
    }
    return c.json(result.gameSession);
  });

  app.patch('/api/lobbies/:lobbyId/game-sessions/:id', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = UpdateGameSessionInputSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const result = await options.updateGameSession(
      c.req.param('lobbyId'),
      c.req.param('id'),
      authSession.user.id,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'invalidStatus') {
      return c.json({ error: 'Cannot edit a cancelled game session' }, 422);
    }
    if (result.type === 'pastScheduledAt') {
      return c.json({ error: 'scheduledAt must be today or later' }, 422);
    }
    return c.json(result.gameSession);
  });

  app.delete('/api/lobbies/:lobbyId/game-sessions/:id', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    const result = await options.deleteGameSession(
      c.req.param('lobbyId'),
      c.req.param('id'),
      authSession.user.id,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'hasSeat') {
      return c.json({ error: 'Cannot delete a game session with seats' }, 409);
    }
    return new Response(null, { status: 204 });
  });

  app.patch('/api/lobbies/:lobbyId/game-sessions/:id/status', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = UpdateGameSessionStatusInputSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const result = await options.updateGameSessionStatus(
      c.req.param('lobbyId'),
      c.req.param('id'),
      authSession.user.id,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'invalidTransition') {
      // v0.2 は 409 だったが、状態が理由で処理できないものは 422 に寄せた（design-v2 §6-10）
      return c.json({ error: 'Invalid status transition' }, 422);
    }
    return c.json(result.gameSession);
  });
};
