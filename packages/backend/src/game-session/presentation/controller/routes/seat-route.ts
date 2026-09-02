import type { Context, Hono } from 'hono';
import type { CreateSeatInput } from '@taku-biyori/shared';
import {
  CreateSeatInputSchema,
  CharacterAssignmentInputSchema,
} from '@taku-biyori/shared';
import type { ListSeatsResult } from '@/game-session/application/list-seats';
import type { CreateSeatResult } from '@/game-session/application/create-seat';
import type { DeleteSeatResult } from '@/game-session/application/delete-seat';
import type { UpdateCharacterAssignmentResult } from '@/game-session/application/update-character-assignment';

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
  updateCharacterAssignment: (
    gameSessionId: string,
    seatId: string,
    userId: string,
    characterName: string | null,
  ) => Promise<UpdateCharacterAssignmentResult>;
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
  // CharacterAssignment の専用経路（#116）。Seat 更新経路と同じ認可・状態判定を共有する。
  const updateCharacter = async (c: Context, characterName: string | null) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);
    const gameSessionId = c.req.param('id');
    const seatId = c.req.param('seatId');
    if (gameSessionId === undefined || seatId === undefined) {
      return c.json({ error: 'Not Found' }, 404);
    }
    const result = await options.updateCharacterAssignment(
      gameSessionId,
      seatId,
      authSession.user.id,
      characterName,
    );
    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'invalidStatus')
      return c.json({ error: 'Game session is cancelled' }, 422);
    return c.json(result.seat);
  };
  app.put(`${BASE}/:seatId/character`, async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }
    const parsed = CharacterAssignmentInputSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
    return updateCharacter(c, parsed.data.characterName);
  });
  app.delete(`${BASE}/:seatId/character`, async (c) =>
    updateCharacter(c, null),
  );

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
