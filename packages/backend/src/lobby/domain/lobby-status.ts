import { LobbyStatus } from '@taku-biyori/shared';

export type LobbyStatusInput = {
  isPublished: boolean;
  openUntil: Date | null;
  closedAt: Date | null;
  cancelledAt: Date | null;
};

export const getLobbyStatus = (
  lobby: LobbyStatusInput,
  now: Date = new Date(),
): LobbyStatus => {
  if (lobby.cancelledAt) return LobbyStatus.cancelled;
  if (lobby.closedAt) return LobbyStatus.confirmed;
  if (!lobby.isPublished) return LobbyStatus.draft;
  if (!lobby.openUntil || now < lobby.openUntil) return LobbyStatus.open;
  return LobbyStatus.scheduling;
};
