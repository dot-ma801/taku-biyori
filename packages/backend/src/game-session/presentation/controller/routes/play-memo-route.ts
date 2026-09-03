import type { Hono } from 'hono';
import type {
  UpdateGameSessionPlayMemoVisibilityInput,
  UpsertGameSessionPlayMemoInput,
} from '@taku-biyori/shared';
import {
  UpdateGameSessionPlayMemoVisibilityInputSchema,
  UpsertGameSessionPlayMemoInputSchema,
} from '@taku-biyori/shared';
import type { GetMyPlayMemoResult } from '@/game-session/application/get-my-play-memo';
import type { UpsertMyPlayMemoResult } from '@/game-session/application/upsert-my-play-memo';
import type { UpdateMyPlayMemoVisibilityResult } from '@/game-session/application/update-my-play-memo-visibility';
import type { ListSharedPlayMemosResult } from '@/game-session/application/list-shared-play-memos';

export interface RegisterPlayMemoRouteOptions {
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  getMyPlayMemo: (
    lobbyId: string,
    gameSessionId: string,
    userId: string,
  ) => Promise<GetMyPlayMemoResult>;
  upsertMyPlayMemo: (
    lobbyId: string,
    gameSessionId: string,
    userId: string,
    input: UpsertGameSessionPlayMemoInput,
  ) => Promise<UpsertMyPlayMemoResult>;
  updateMyPlayMemoVisibility: (
    lobbyId: string,
    gameSessionId: string,
    userId: string,
    input: UpdateGameSessionPlayMemoVisibilityInput,
  ) => Promise<UpdateMyPlayMemoVisibilityResult>;
  listSharedPlayMemos: (
    lobbyId: string,
    gameSessionId: string,
    userId: string | null,
  ) => Promise<ListSharedPlayMemosResult>;
}

/**
 * プレイメモのルート。開催はロビー配下に入れ子になったので
 * `/api/lobbies/:lobbyId/game-sessions/:id/play-memos...` に揃える（design-v2 §6-13）。
 *
 * リクエスト・レスポンス・エラーコードの契約は v2 で変えていない（design-v2 §6-15）。
 * このファイルの `design-v1.2 §…` はその挙動を記録した**履歴参照**で、
 * 現行の仕様は design-v2 を見ること。
 */
const BASE = '/api/lobbies/:lobbyId/game-sessions/:id/play-memos';

export const registerPlayMemoRoute = (
  app: Hono,
  options: RegisterPlayMemoRouteOptions,
): void => {
  app.get(`${BASE}/me`, async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    const result = await options.getMyPlayMemo(
      c.req.param('lobbyId'),
      c.req.param('id'),
      authSession.user.id,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json(result.playMemo);
  });

  app.put(`${BASE}/me`, async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed = UpsertGameSessionPlayMemoInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const result = await options.upsertMyPlayMemo(
      c.req.param('lobbyId'),
      c.req.param('id'),
      authSession.user.id,
      parsed.data,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    // 確定後ロックのエラーコードは 409 に統一する（423 は使わない。design-v1.2 §8）
    if (result.type === 'statusLocked') {
      return c.json({ error: 'Cannot edit play memo in this status' }, 409);
    }
    return c.json(result.playMemo);
  });

  app.patch(`${BASE}/me/visibility`, async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    if (!authSession) return c.json({ error: 'Unauthorized' }, 401);

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const parsed =
      UpdateGameSessionPlayMemoVisibilityInputSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    // 本文編集と違いステータスによるロック（409）は無い。完了・中止後も切り替えられる
    // （「遊んだ後に公開する」が本機能の主目的であるため。design-v1.2 §4）
    const result = await options.updateMyPlayMemoVisibility(
      c.req.param('lobbyId'),
      c.req.param('id'),
      authSession.user.id,
      parsed.data,
    );

    // 開催が無い場合とメモ未作成の場合の両方が notFound（design-v1.2 §5）
    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json(result.playMemo);
  });

  // 公開メモの閲覧は未ログイン・ゲストにも開く（要求 §3-4 / design-v2 §4-3）。
  // 認証は「非公開の開催かどうか」の判定にのみ使うため、未ログインでも 401 にしない
  app.get(BASE, async (c) => {
    const authSession = await options.getSession(c.req.raw.headers);
    const userId = authSession?.user.id ?? null;

    const result = await options.listSharedPlayMemos(
      c.req.param('lobbyId'),
      c.req.param('id'),
      userId,
    );

    if (result.type === 'notFound') return c.json({ error: 'Not Found' }, 404);
    // 非公開の開催をホスト以外が呼んだケース。ログインの有無で分けず 403 に統一する
    // （design-v1.2 §5 のエラー表）
    if (result.type === 'forbidden') return c.json({ error: 'Forbidden' }, 403);
    return c.json(result.playMemos);
  });
};
