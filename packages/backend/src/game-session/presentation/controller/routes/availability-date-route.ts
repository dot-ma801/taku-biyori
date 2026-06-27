import type { Hono } from 'hono';
import type {
  AvailabilityDate,
  AvailabilityDateAnswer,
  BulkUpdateAvailabilityDatesInput,
  GameSession,
  UpdateAvailabilityDateResponseInput,
} from '@taku-biyori/shared';
import {
  BulkUpdateAvailabilityDatesInputSchema,
  CreateAvailabilityDateInputSchema,
  GUEST_TOKEN_HEADER,
  GuestUpdateAvailabilityDateResponseInputSchema,
  UpdateAvailabilityDateResponseInputSchema,
} from '@taku-biyori/shared';
import type { AddAvailabilityDateResult } from '@/game-session/application/add-availability-date';
import type { DeleteAvailabilityDateResult } from '@/game-session/application/delete-availability-date';
import type { ConfirmAvailabilityDateResult } from '@/game-session/application/confirm-availability-date';
import type { ListAvailabilityDatesResult } from '@/game-session/application/list-availability-dates';
import type { BulkUpdateAvailabilityDatesResult } from '@/game-session/application/bulk-update-availability-dates';
import type { UpdateAvailabilityDateResponseResult } from '@/game-session/application/update-availability-date-response';
import type { UpdateGuestAvailabilityDateResponseResult } from '@/game-session/application/update-guest-availability-date-response';

export interface RegisterAvailabilityDateRouteOptions {
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  listAvailabilityDates: (
    gameSessionId: string,
  ) => Promise<ListAvailabilityDatesResult>;
  addAvailabilityDate: (
    gameSessionId: string,
    userId: string,
    input: { date: string },
  ) => Promise<AddAvailabilityDateResult>;
  bulkUpdateAvailabilityDates: (
    gameSessionId: string,
    userId: string,
    input: BulkUpdateAvailabilityDatesInput,
  ) => Promise<BulkUpdateAvailabilityDatesResult>;
  deleteAvailabilityDate: (
    gameSessionId: string,
    dateId: string,
    userId: string,
  ) => Promise<DeleteAvailabilityDateResult>;
  confirmAvailabilityDate: (
    gameSessionId: string,
    dateId: string,
    userId: string,
  ) => Promise<ConfirmAvailabilityDateResult>;
  updateAvailabilityDateResponse: (
    gameSessionId: string,
    dateId: string,
    userId: string,
    input: UpdateAvailabilityDateResponseInput,
  ) => Promise<UpdateAvailabilityDateResponseResult>;
  updateGuestAvailabilityDateResponse: (
    gameSessionId: string,
    dateId: string,
    token: string,
    memberId: string,
    input: UpdateAvailabilityDateResponseInput,
  ) => Promise<UpdateGuestAvailabilityDateResponseResult>;
}

export const registerAvailabilityDateRoute = (
  app: Hono,
  options: RegisterAvailabilityDateRouteOptions,
): void => {
  app.get('/api/game-sessions/:id/availability-dates', async (c) => {
    const result = await options.listAvailabilityDates(c.req.param('id'));
    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    return c.json(result.dates satisfies AvailabilityDate[]);
  });

  app.put('/api/game-sessions/:id/availability-dates', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = BulkUpdateAvailabilityDatesInputSchema.safeParse(body);
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
    if (result.type === 'conflict')
      return c.json({ error: 'Conflict: already scheduled' }, 409);
    return c.json(result.dates satisfies AvailabilityDate[]);
  });

  app.post('/api/game-sessions/:id/availability-dates', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = CreateAvailabilityDateInputSchema.safeParse(body);
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
    if (result.type === 'conflict')
      return c.json({ error: 'Conflict: already scheduled' }, 409);
    return c.json(result.date satisfies AvailabilityDate, 201);
  });

  app.delete('/api/game-sessions/:id/availability-dates/:dateId', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    const result = await options.deleteAvailabilityDate(
      c.req.param('id'),
      c.req.param('dateId'),
      authSession.user.id,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'conflict')
      return c.json({ error: 'Conflict: already scheduled' }, 409);
    return new Response(null, { status: 204 });
  });

  app.post(
    '/api/game-sessions/:id/availability-dates/:dateId/confirm',
    async (c) => {
      const authSession = await options.getSession(c.req.raw.headers);
      if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

      const result = await options.confirmAvailabilityDate(
        c.req.param('id'),
        c.req.param('dateId'),
        authSession.user.id,
      );

      if (result.type === 'notFound')
        return c.json({ error: 'Not Found' }, 404);
      if (result.type === 'forbidden')
        return c.json({ error: 'Forbidden' }, 403);
      return c.json(result.gameSession satisfies GameSession);
    },
  );

  app.put(
    '/api/game-sessions/:id/availability-dates/:dateId/responses',
    async (c) => {
      const authSession = await options.getSession(c.req.raw.headers);
      if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

      let body: unknown;
      try {
        body = await c.req.json();
      } catch {
        return c.json({ error: 'Invalid JSON' }, 400);
      }

      const parsed = UpdateAvailabilityDateResponseInputSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues }, 400);
      }

      const result = await options.updateAvailabilityDateResponse(
        c.req.param('id'),
        c.req.param('dateId'),
        authSession.user.id,
        parsed.data,
      );

      if (result.type === 'notFound')
        return c.json({ error: 'Not Found' }, 404);
      if (result.type === 'forbidden')
        return c.json({ error: 'Forbidden' }, 403);
      return c.json(result.answer satisfies AvailabilityDateAnswer);
    },
  );

  // ゲストの日程回答。認証不要、X-Guest-Token ヘッダーで認可する。
  app.put(
    '/api/game-sessions/:id/availability-dates/:dateId/guest-responses',
    async (c) => {
      const token = c.req.header(GUEST_TOKEN_HEADER) ?? '';

      let body: unknown;
      try {
        body = await c.req.json();
      } catch {
        return c.json({ error: 'Invalid JSON' }, 400);
      }

      const parsed =
        GuestUpdateAvailabilityDateResponseInputSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues }, 400);
      }

      const { memberId, ...input } = parsed.data;
      const result = await options.updateGuestAvailabilityDateResponse(
        c.req.param('id'),
        c.req.param('dateId'),
        token,
        memberId,
        input,
      );

      if (result.type === 'notFound')
        return c.json({ error: 'Not Found' }, 404);
      if (result.type === 'invalidToken')
        return c.json({ error: 'Invalid guest token' }, 403);
      if (result.type === 'forbidden')
        return c.json({ error: 'Forbidden' }, 403);
      if (result.type === 'locked')
        return c.json({ error: 'Locked: session is not open for responses' }, 423);
      return c.json(result.answer satisfies AvailabilityDateAnswer);
    },
  );
};
