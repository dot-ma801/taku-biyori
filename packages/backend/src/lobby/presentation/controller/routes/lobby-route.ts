import type { Hono } from 'hono';
import type {
  Lobby,
  LobbyListItem,
  CreateLobbyInput,
  UpdateLobbyInput,
  UpdateLobbyStatusInput,
} from '@taku-biyori/shared';
import {
  CreateLobbyInputSchema,
  UpdateLobbyInputSchema,
  UpdateLobbyStatusInputSchema,
} from '@taku-biyori/shared';
import type { GetLobbyResult } from '@/lobby/application/get-lobby';
import type { UpdateLobbyResult } from '@/lobby/application/update-lobby';
import type { DeleteLobbyResult } from '@/lobby/application/delete-lobby';
import type { UpdateLobbyStatusResult } from '@/lobby/application/update-lobby-status';

export interface RegisterLobbyRouteOptions {
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  listLobbies: (userId: string) => Promise<LobbyListItem[]>;
  createLobby: (userId: string, input: CreateLobbyInput) => Promise<Lobby>;
  getLobby: (id: string, userId: string | null) => Promise<GetLobbyResult>;
  updateLobby: (
    id: string,
    userId: string,
    input: UpdateLobbyInput,
  ) => Promise<UpdateLobbyResult>;
  deleteLobby: (id: string, userId: string) => Promise<DeleteLobbyResult>;
  updateLobbyStatus: (
    id: string,
    userId: string,
    input: UpdateLobbyStatusInput,
  ) => Promise<UpdateLobbyStatusResult>;
}

export const registerLobbyRoute = (
  app: Hono,
  options: RegisterLobbyRouteOptions,
): void => {
  app.get('/api/lobbies', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const lobbies = await options.listLobbies(authSession.user.id);
    return c.json(lobbies);
  });

  app.post('/api/lobbies', async (c) => {
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

    const parsed = CreateLobbyInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const lobby = await options.createLobby(authSession.user.id, parsed.data);
    return c.json(lobby, 201);
  });

  app.get('/api/lobbies/:id', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    const userId = authSession?.user.id ?? null;

    const result = await options.getLobby(c.req.param('id'), userId);

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') {
      return userId === null
        ? c.json({ error: 'Unauthorized' }, 401)
        : c.json({ error: 'Forbidden' }, 403);
    }
    return c.json(result.lobby);
  });

  app.patch('/api/lobbies/:id', async (c) => {
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

    const parsed = UpdateLobbyInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const result = await options.updateLobby(
      c.req.param('id'),
      authSession.user.id,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'invalidStatus') {
      return c.json({ error: 'Cannot update lobby in this status' }, 409);
    }
    return c.json(result.lobby);
  });

  app.delete('/api/lobbies/:id', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await options.deleteLobby(
      c.req.param('id'),
      authSession.user.id,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'hasMember') {
      return c.json({ error: 'Cannot delete lobby with members' }, 409);
    }
    return new Response(null, { status: 204 });
  });

  app.patch('/api/lobbies/:id/status', async (c) => {
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

    const parsed = UpdateLobbyStatusInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const result = await options.updateLobbyStatus(
      c.req.param('id'),
      authSession.user.id,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'invalidTransition') {
      // 状態が操作を許さないため 422（design-v2 §6-13-2）
      return c.json({ error: 'Invalid status transition' }, 422);
    }
    return c.json(result.lobby);
  });
};
