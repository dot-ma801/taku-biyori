import type { Hono } from 'hono';
import type { CreateSeatInput, UpdateSeatInput } from '@taku-biyori/shared';
import {
  CreateSeatInputSchema,
  UpdateSeatInputSchema,
} from '@taku-biyori/shared';
import type { ListSeatsResult } from '@/game-session/application/list-seats';
import type { CreateSeatResult } from '@/game-session/application/create-seat';
import type { UpdateSeatResult } from '@/game-session/application/update-seat';
import type { DeleteSeatResult } from '@/game-session/application/delete-seat';

export interface RegisterSeatRouteOptions {
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  listSeats: (
    lobbyId: string,
    gameSessionId: string,
    userId: string | null,
  ) => Promise<ListSeatsResult>;
  createSeat: (
    lobbyId: string,
    gameSessionId: string,
    userId: string,
    input: CreateSeatInput,
  ) => Promise<CreateSeatResult>;
  updateSeat: (
    lobbyId: string,
    gameSessionId: string,
    seatId: string,
    userId: string,
    input: UpdateSeatInput,
  ) => Promise<UpdateSeatResult>;
  deleteSeat: (
    lobbyId: string,
    gameSessionId: string,
    seatId: string,
    userId: string,
  ) => Promise<DeleteSeatResult>;
}

const BASE = '/api/lobbies/:lobbyId/game-sessions/:id/seats';

/**
 * 着席のルート（design-v2 §6-6）。v0.2 の `member-route.ts` を置き換える。
 *
 * 廃止したもの: 自分で着席する経路（body 無しの POST）と、
 * ゲストの「参加 + 着席」（`POST .../guest-seats`）。着席させられるのはホストだけになった。
 */
export const registerSeatRoute = (
  app: Hono,
  options: RegisterSeatRouteOptions,
): void => {
  app.get(BASE, async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    const userId = authSession?.user.id ?? null;

    const result = await options.listSeats(
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
    return c.json(result.seats);
  });

  app.post(BASE, async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = CreateSeatInputSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const result = await options.createSeat(
      c.req.param('lobbyId'),
      c.req.param('id'),
      authSession.user.id,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'alreadySeated') {
      return c.json({ error: 'Already seated' }, 409);
    }
    if (result.type === 'invalidStatus') {
      return c.json({ error: 'Game session is completed or cancelled' }, 422);
    }
    if (result.type === 'invalidEntry') {
      return c.json(
        { error: 'entryId is not an active entry of this lobby' },
        422,
      );
    }
    return c.json(result.seat, 201);
  });

  app.patch(`${BASE}/:seatId`, async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = UpdateSeatInputSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const result = await options.updateSeat(
      c.req.param('lobbyId'),
      c.req.param('id'),
      c.req.param('seatId'),
      authSession.user.id,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'invalidStatus') {
      return c.json({ error: 'Game session is cancelled' }, 422);
    }
    return c.json(result.seat);
  });

  app.delete(`${BASE}/:seatId`, async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    const result = await options.deleteSeat(
      c.req.param('lobbyId'),
      c.req.param('id'),
      c.req.param('seatId'),
      authSession.user.id,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'invalidStatus') {
      return c.json({ error: 'Game session is completed or cancelled' }, 422);
    }
    return new Response(null, { status: 204 });
  });
};
