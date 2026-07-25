import { GameSessionStatus } from '@taku-biyori/shared';

export type GameSessionStatusInput = {
  isPublished: boolean;
  scheduledAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
};

/**
 * 卓のステータスをファクトから導出する（design-v1.1 §8）。
 *
 * 段階6b で募集（`open_until`）を募集枠（lobby）へ移したため、`open` は導出しない。
 * `open` は `PATCH /:id/status` のリクエスト値（公開遷移 `draft → open`）としてのみ残る。
 * `scheduled_at` が null のときの `scheduling` は、NOT NULL 化が段階6c 担当であるため
 * それまでのフォールバックとして残す。
 */
export const getGameSessionStatus = (
  session: GameSessionStatusInput,
  now: Date = new Date(),
): GameSessionStatus => {
  // 中止は最優先の終端状態（design-v1.1 §8・completedAt と対称なファクト）
  if (session.cancelledAt) return GameSessionStatus.cancelled;
  if (!session.isPublished) return GameSessionStatus.draft;
  if (session.scheduledAt) {
    if (session.completedAt) return GameSessionStatus.completed;
    if (isToday(session.scheduledAt, now)) return GameSessionStatus.today;
    return GameSessionStatus.confirmed;
  }
  return GameSessionStatus.scheduling;
};

const isToday = (date: Date, now: Date): boolean =>
  date.getFullYear() === now.getFullYear() &&
  date.getMonth() === now.getMonth() &&
  date.getDate() === now.getDate();
