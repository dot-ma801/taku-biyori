import { LobbyStatus } from '@taku-biyori/shared';

export type LobbyStatusInput = {
  isPublished: boolean;
  openUntil: Date | null;
  cancelledAt: Date | null;
};

// 日程候補の一括更新を許可するステータス（draft は非公開段階として許容する）
export const EDITABLE_CANDIDATE_STATUSES = new Set<LobbyStatus>([
  LobbyStatus.draft,
  LobbyStatus.open,
  LobbyStatus.scheduling,
]);

export const getLobbyStatus = (
  lobby: LobbyStatusInput,
  now: Date = new Date(),
): LobbyStatus => {
  if (lobby.cancelledAt) return LobbyStatus.cancelled;
  if (!lobby.isPublished) return LobbyStatus.draft;
  if (!lobby.openUntil || now < lobby.openUntil) return LobbyStatus.open;
  return LobbyStatus.scheduling;
};
