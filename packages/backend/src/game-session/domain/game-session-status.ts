import type { GameSessionStatus } from '@taku-biyori/shared';

export type GameSessionStatusInput = {
  isPublished: boolean;
  openUntil: Date | null;
  scheduledAt: Date | null;
  completedAt: Date | null;
};

export const getGameSessionStatus = (
  session: GameSessionStatusInput,
  now: Date = new Date(),
): GameSessionStatus => {
  if (!session.isPublished) return 'draft';
  if (session.openUntil && now < session.openUntil) return 'open';
  if (!session.scheduledAt) return 'scheduling';
  if (session.completedAt) return 'completed';
  if (isToday(session.scheduledAt, now)) return 'today';
  return 'confirmed';
};

const isToday = (date: Date, now: Date): boolean =>
  date.getFullYear() === now.getFullYear() &&
  date.getMonth() === now.getMonth() &&
  date.getDate() === now.getDate();
