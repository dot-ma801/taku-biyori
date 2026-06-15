import { GameSessionStatus } from '@taku-biyori/shared';

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
  if (!session.isPublished) return GameSessionStatus.draft;
  if (session.openUntil && now < session.openUntil)
    return GameSessionStatus.open;
  if (!session.scheduledAt) return GameSessionStatus.scheduling;
  if (session.completedAt) return GameSessionStatus.completed;
  if (isToday(session.scheduledAt, now)) return GameSessionStatus.today;
  return GameSessionStatus.confirmed;
};

const isToday = (date: Date, now: Date): boolean =>
  date.getFullYear() === now.getFullYear() &&
  date.getMonth() === now.getMonth() &&
  date.getDate() === now.getDate();
