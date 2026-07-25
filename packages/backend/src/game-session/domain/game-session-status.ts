import { GameSessionStatus } from '@taku-biyori/shared';

export type GameSessionStatusInput = {
  isPublished: boolean;
  scheduledAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
};

/**
 * 卓のステータスをファクトから導出する（design-v1.1 §8）。
 *
 * 導出結果は `draft` / `confirmed` / `today` / `completed` / `cancelled` の5値。
 * 段階6b で募集（`open_until`）を、段階6c で日程調整を募集枠（lobby）へ移したため、
 * `open` と `scheduling` は導出しない。
 * `open` は `PATCH /:id/status` のリクエスト値（公開遷移 `draft → open`）としてのみ残る。
 */
export const getGameSessionStatus = (
  session: GameSessionStatusInput,
  now: Date = new Date(),
): GameSessionStatus => {
  // 中止は最優先の終端状態（design-v1.1 §8・completedAt と対称なファクト）
  if (session.cancelledAt) return GameSessionStatus.cancelled;
  if (!session.isPublished) return GameSessionStatus.draft;
  if (session.completedAt) return GameSessionStatus.completed;
  if (isToday(session.scheduledAt, now)) return GameSessionStatus.today;
  return GameSessionStatus.confirmed;
};

const isToday = (date: Date, now: Date): boolean =>
  date.getFullYear() === now.getFullYear() &&
  date.getMonth() === now.getMonth() &&
  date.getDate() === now.getDate();
