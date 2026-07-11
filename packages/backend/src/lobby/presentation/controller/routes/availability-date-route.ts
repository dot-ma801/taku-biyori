import type { Hono } from 'hono';
import type {
  LobbyAvailabilityDate,
  BulkUpdateLobbyAvailabilityDatesInput,
} from '@taku-biyori/shared';
import {
  BulkUpdateLobbyAvailabilityDatesInputSchema,
  CreateLobbyAvailabilityDateInputSchema,
} from '@taku-biyori/shared';
import type { AddAvailabilityDateResult } from '@/lobby/application/add-availability-date';
import type { DeleteAvailabilityDateResult } from '@/lobby/application/delete-availability-date';
import type { ListAvailabilityDatesResult } from '@/lobby/application/list-availability-dates';
import type { BulkUpdateAvailabilityDatesResult } from '@/lobby/application/bulk-update-availability-dates';

export interface RegisterAvailabilityDateRouteOptions {
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  listAvailabilityDates: (
    lobbyId: string,
    userId: string | null,
  ) => Promise<ListAvailabilityDatesResult>;
  addAvailabilityDate: (
    lobbyId: string,
    userId: string,
    input: { date: string },
  ) => Promise<AddAvailabilityDateResult>;
  bulkUpdateAvailabilityDates: (
    lobbyId: string,
    userId: string,
    input: BulkUpdateLobbyAvailabilityDatesInput,
  ) => Promise<BulkUpdateAvailabilityDatesResult>;
  deleteAvailabilityDate: (
    lobbyId: string,
    dateId: string,
    userId: string,
  ) => Promise<DeleteAvailabilityDateResult>;
}

// 募集枠の「確定」（日程＋メンバー選出＋卓生成を不可分に行う）は
// POST /api/lobbies/:id/confirm が担う（issue #62 で実装予定・本ルートの対象外）。
// game-session にある「候補日単体の確定」(.../availability-dates/:dateId/confirm) 相当は
// 募集枠には存在しない（design-v1.1 §Lobby Schedules）。
export const registerAvailabilityDateRoute = (
  app: Hono,
  options: RegisterAvailabilityDateRouteOptions,
): void => {
  app.get('/api/lobbies/:id/availability-dates', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    const userId = authSession?.user.id ?? null;

    const result = await options.listAvailabilityDates(
      c.req.param('id'),
      userId,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') {
      return userId === null
        ? c.json({ error: 'Unauthorized' }, 401)
        : c.json({ error: 'Forbidden' }, 403);
    }
    return c.json(result.dates satisfies LobbyAvailabilityDate[]);
  });

  app.put('/api/lobbies/:id/availability-dates', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = BulkUpdateLobbyAvailabilityDatesInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const result = await options.bulkUpdateAvailabilityDates(
      c.req.param('id'),
      authSession.user.id,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'invalidStatus') {
      return c.json(
        { error: 'Cannot update availability dates in this status' },
        409,
      );
    }
    return c.json(result.dates satisfies LobbyAvailabilityDate[]);
  });

  app.post('/api/lobbies/:id/availability-dates', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = CreateLobbyAvailabilityDateInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const result = await options.addAvailabilityDate(
      c.req.param('id'),
      authSession.user.id,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'invalidStatus') {
      return c.json(
        { error: 'Cannot add availability date in this status' },
        409,
      );
    }
    return c.json(result.date satisfies LobbyAvailabilityDate, 201);
  });

  app.delete('/api/lobbies/:id/availability-dates/:dateId', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    const result = await options.deleteAvailabilityDate(
      c.req.param('id'),
      c.req.param('dateId'),
      authSession.user.id,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'invalidStatus') {
      return c.json(
        { error: 'Cannot delete availability date in this status' },
        409,
      );
    }
    return new Response(null, { status: 204 });
  });
};
