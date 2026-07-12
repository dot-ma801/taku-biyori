import type { Hono } from 'hono';
import type {
  Lobby,
  LobbyListItem,
  CreateLobbyInput,
  UpdateLobbyInput,
  UpdateLobbyStatusInput,
  ConfirmLobbyInput,
  GameSession,
} from '@taku-biyori/shared';
import {
  CreateLobbyInputSchema,
  UpdateLobbyInputSchema,
  UpdateLobbyStatusInputSchema,
  ConfirmLobbyInputSchema,
} from '@taku-biyori/shared';
import type { GetLobbyResult } from '@/lobby/application/get-lobby';
import type { UpdateLobbyResult } from '@/lobby/application/update-lobby';
import type { DeleteLobbyResult } from '@/lobby/application/delete-lobby';
import type { UpdateLobbyStatusResult } from '@/lobby/application/update-lobby-status';
import type { ConfirmLobbyResult } from '@/lobby/application/confirm-lobby';

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
  confirmLobby: (
    id: string,
    userId: string,
    input: ConfirmLobbyInput,
  ) => Promise<ConfirmLobbyResult>;
}

/**
 * candidateDates が「1件以上の配列」であるかだけを先に検査する。
 * 候補日なしの募集枠は存在意義がない（design-v1.1 §6）ため、
 * 通常のバリデーションエラー（400）と区別して 422 を返す。
 */
const hasCandidateDates = (body: unknown): boolean => {
  if (typeof body !== 'object' || body === null) return false;
  const candidateDates = (body as Record<string, unknown>).candidateDates;
  return Array.isArray(candidateDates) && candidateDates.length > 0;
};

/**
 * memberIds が「1件以上の配列」であるかだけを先に検査する。
 * 選出対象0人での確定は許可しない（design-v1.1 §5・意思決定ログ）ため、
 * 通常のバリデーションエラー（400）と区別して 422 を返す。
 */
const hasMemberIds = (body: unknown): boolean => {
  if (typeof body !== 'object' || body === null) return false;
  const memberIds = (body as Record<string, unknown>).memberIds;
  return Array.isArray(memberIds) && memberIds.length > 0;
};

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

    if (!hasCandidateDates(body)) {
      return c.json({ error: '候補日を1件以上指定してください' }, 422);
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
    if (result.type === 'invalidStatus') {
      return c.json({ error: 'Cannot delete lobby in this status' }, 409);
    }
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
      return c.json({ error: 'Invalid status transition' }, 409);
    }
    return c.json(result.lobby);
  });

  // 卓確定（選出）。design-v1.1 §5 参照。
  app.post('/api/lobbies/:id/confirm', async (c) => {
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

    if (!hasMemberIds(body)) {
      return c.json({ error: 'メンバーを1件以上選出してください' }, 422);
    }

    const parsed = ConfirmLobbyInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const result = await options.confirmLobby(
      c.req.param('id'),
      authSession.user.id,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'invalidStatus') {
      return c.json({ error: 'Cannot confirm lobby in this status' }, 422);
    }
    if (result.type === 'candidateNotFound') {
      return c.json({ error: 'Candidate date not found' }, 404);
    }
    if (result.type === 'invalidMembers') {
      return c.json({ error: 'Invalid member selection' }, 422);
    }
    if (result.type === 'conflict') {
      return c.json({ error: 'Lobby already confirmed' }, 409);
    }
    return c.json(result.gameSession satisfies GameSession, 201);
  });
};
