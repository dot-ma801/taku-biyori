import type { Hono } from 'hono';
import type {
  LobbySchedulePollSummary,
  LobbySchedulePoll,
  LobbyCandidateDate,
  LobbyScheduleAnswer,
  CreateSchedulePollInput,
  ReplaceCandidateDatesInput,
  UpsertScheduleAnswersInput,
  GuestUpsertScheduleAnswersInput,
} from '@taku-biyori/shared';
import {
  CreateSchedulePollInputSchema,
  ReplaceCandidateDatesInputSchema,
  UpsertScheduleAnswersInputSchema,
  GuestUpsertScheduleAnswersInputSchema,
  GUEST_TOKEN_HEADER,
} from '@taku-biyori/shared';
import type { ListSchedulePollsResult } from '@/lobby/application/list-schedule-polls';
import type { GetSchedulePollResult } from '@/lobby/application/get-schedule-poll';
import type { CreateSchedulePollResult } from '@/lobby/application/create-schedule-poll';
import type { ReplaceCandidateDatesResult } from '@/lobby/application/replace-candidate-dates';
import type { UpsertScheduleAnswersResult } from '@/lobby/application/upsert-schedule-answers';
import type { UpsertGuestScheduleAnswersResult } from '@/lobby/application/upsert-guest-schedule-answers';

export interface RegisterSchedulePollRouteOptions {
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  listSchedulePolls: (
    lobbyId: string,
    userId: string | null,
  ) => Promise<ListSchedulePollsResult>;
  getSchedulePoll: (
    lobbyId: string,
    pollId: string,
    userId: string | null,
  ) => Promise<GetSchedulePollResult>;
  createSchedulePoll: (
    lobbyId: string,
    userId: string,
    input: CreateSchedulePollInput,
  ) => Promise<CreateSchedulePollResult>;
  replaceCandidateDates: (
    lobbyId: string,
    pollId: string,
    userId: string,
    input: ReplaceCandidateDatesInput,
  ) => Promise<ReplaceCandidateDatesResult>;
  upsertScheduleAnswers: (
    lobbyId: string,
    pollId: string,
    userId: string,
    input: UpsertScheduleAnswersInput,
  ) => Promise<UpsertScheduleAnswersResult>;
  upsertGuestScheduleAnswers: (
    lobbyId: string,
    pollId: string,
    token: string,
    input: GuestUpsertScheduleAnswersInput,
  ) => Promise<UpsertGuestScheduleAnswersResult>;
}

export const registerSchedulePollRoute = (
  app: Hono,
  options: RegisterSchedulePollRouteOptions,
): void => {
  app.get('/api/lobbies/:id/schedule-polls', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    const userId = authSession?.user.id ?? null;

    const result = await options.listSchedulePolls(c.req.param('id'), userId);

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') {
      return userId === null
        ? c.json({ error: 'Unauthorized' }, 401)
        : c.json({ error: 'Forbidden' }, 403);
    }
    return c.json(result.polls satisfies LobbySchedulePollSummary[]);
  });

  app.post('/api/lobbies/:id/schedule-polls', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = CreateSchedulePollInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const result = await options.createSchedulePoll(
      c.req.param('id'),
      authSession.user.id,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'invalidStatus') {
      return c.json(
        { error: 'Cannot start schedule poll in this status' },
        422,
      );
    }
    return c.json(result.poll satisfies LobbySchedulePoll, 201);
  });

  app.get('/api/lobbies/:id/schedule-polls/:pollId', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    const userId = authSession?.user.id ?? null;

    const result = await options.getSchedulePoll(
      c.req.param('id'),
      c.req.param('pollId'),
      userId,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') {
      return userId === null
        ? c.json({ error: 'Unauthorized' }, 401)
        : c.json({ error: 'Forbidden' }, 403);
    }
    return c.json(result.poll satisfies LobbySchedulePoll);
  });

  // 候補日は全置換。過去日を新規追加した場合は 400、最新の調整でない場合は 409。
  app.put(
    '/api/lobbies/:id/schedule-polls/:pollId/candidate-dates',
    async (c) => {
      const authSession = await options.getSession(c.req.raw.headers);
      if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

      let body: unknown;
      try {
        body = await c.req.json();
      } catch {
        return c.json({ error: 'Invalid JSON' }, 400);
      }

      const parsed = ReplaceCandidateDatesInputSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues }, 400);
      }

      const result = await options.replaceCandidateDates(
        c.req.param('id'),
        c.req.param('pollId'),
        authSession.user.id,
        parsed.data,
      );

      if (result.type === 'notFound')
        return c.json({ error: 'Not Found' }, 404);
      if (result.type === 'forbidden')
        return c.json({ error: 'Forbidden' }, 403);
      if (result.type === 'invalidStatus') {
        return c.json(
          { error: 'Cannot update candidate dates in this status' },
          422,
        );
      }
      if (result.type === 'notLatest') {
        return c.json({ error: 'Not the latest schedule poll' }, 409);
      }
      if (result.type === 'pastDateAdded') {
        return c.json(
          { error: 'Cannot add a past date that is not already in this poll' },
          400,
        );
      }
      return c.json(result.dates satisfies LobbyCandidateDate[]);
    },
  );

  // ログインユーザーの日程回答。送った候補日ぶんだけ upsert する差分更新。
  app.patch('/api/lobbies/:id/schedule-polls/:pollId/answers', async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = UpsertScheduleAnswersInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const result = await options.upsertScheduleAnswers(
      c.req.param('id'),
      c.req.param('pollId'),
      authSession.user.id,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    if (result.type === 'notLatest') {
      return c.json({ error: 'Not the latest schedule poll' }, 409);
    }
    if (result.type === 'notPublished') {
      return c.json(
        { error: 'Cannot respond before the lobby is published' },
        422,
      );
    }
    if (result.type === 'invalidStatus') {
      return c.json(
        { error: 'Cannot respond to schedule poll in this status' },
        422,
      );
    }
    return c.json(result.answers satisfies LobbyScheduleAnswer[]);
  });

  // ゲストの日程回答（完全匿名）。認証不要、Guest-Token ヘッダーで認可する。
  app.patch(
    '/api/lobbies/:id/schedule-polls/:pollId/guest-answers',
    async (c) => {
      const token = c.req.header(GUEST_TOKEN_HEADER) ?? '';

      let body: unknown;
      try {
        body = await c.req.json();
      } catch {
        return c.json({ error: 'Invalid JSON' }, 400);
      }

      const parsed = GuestUpsertScheduleAnswersInputSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues }, 400);
      }

      const result = await options.upsertGuestScheduleAnswers(
        c.req.param('id'),
        c.req.param('pollId'),
        token,
        parsed.data,
      );

      if (result.type === 'notFound')
        return c.json({ error: 'Not Found' }, 404);
      if (result.type === 'invalidToken') {
        return c.json({ error: 'Invalid guest token' }, 403);
      }
      if (result.type === 'forbidden')
        return c.json({ error: 'Forbidden' }, 403);
      if (result.type === 'notLatest') {
        return c.json({ error: 'Not the latest schedule poll' }, 409);
      }
      if (result.type === 'invalidStatus') {
        return c.json(
          { error: 'Cannot respond to schedule poll in this status' },
          422,
        );
      }
      return c.json(result.answers satisfies LobbyScheduleAnswer[]);
    },
  );
};
