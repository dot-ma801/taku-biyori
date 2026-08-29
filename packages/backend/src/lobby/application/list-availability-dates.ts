import type { LobbyAvailabilityDate } from '@taku-biyori/shared';

export interface ListAvailabilityDatesRepository {
  findLobbyVisibility(
    id: string,
  ): Promise<{ publishedAt: Date | null; hostUserId: string } | null>;
  findByLobbyId(lobbyId: string): Promise<LobbyAvailabilityDate[]>;
}

export type ListAvailabilityDatesResult =
  | { type: 'ok'; dates: LobbyAvailabilityDate[] }
  | { type: 'notFound' }
  | { type: 'forbidden' };

/**
 * 公開済みの募集枠は誰でも候補日一覧を閲覧できる。
 * 非公開（draft）はホストのみ（listMembers と同方針。design-v1.1 §Lobby Schedules）。
 */
export const listAvailabilityDates = async (
  repo: ListAvailabilityDatesRepository,
  lobbyId: string,
  userId: string | null,
): Promise<ListAvailabilityDatesResult> => {
  const visibility = await repo.findLobbyVisibility(lobbyId);
  if (!visibility) return { type: 'notFound' };

  if (visibility.publishedAt === null && visibility.hostUserId !== userId) {
    return { type: 'forbidden' };
  }

  const dates = await repo.findByLobbyId(lobbyId);
  return { type: 'ok', dates };
};
