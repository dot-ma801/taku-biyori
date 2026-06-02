import {
  GameSessionStatusSchema,
  type GameSessionStatus,
} from '@taku-biyori/shared';

const { enum: Status } = GameSessionStatusSchema;

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
  if (!session.isPublished) return Status.draft;
  if (session.openUntil && now < session.openUntil) return Status.open;
  if (!session.scheduledAt) return Status.scheduling;
  if (session.completedAt) return Status.completed;
  if (isToday(session.scheduledAt, now)) return Status.today;
  return Status.confirmed;
};

const isToday = (date: Date, now: Date): boolean =>
  date.getFullYear() === now.getFullYear() &&
  date.getMonth() === now.getMonth() &&
  date.getDate() === now.getDate();
