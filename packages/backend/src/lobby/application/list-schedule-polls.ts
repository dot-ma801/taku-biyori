import type { LobbySchedulePollSummary } from '@taku-biyori/shared';

export interface ListSchedulePollsRepository {
  findLobbyVisibility(
    id: string,
  ): Promise<{ publishedAt: Date | null; hostUserId: string } | null>;
  /** created_at DESC, id DESC 順（先頭が最新） */
  findSchedulePollSummaries(
    lobbyId: string,
  ): Promise<LobbySchedulePollSummary[]>;
}

export type ListSchedulePollsResult =
  | { type: 'ok'; polls: LobbySchedulePollSummary[] }
  | { type: 'notFound' }
  | { type: 'forbidden' };

/**
 * 日程調整の履歴一覧。公開済みの募集枠は誰でも閲覧できる。
 * 非公開（draft）はホストのみ（listEntries と同方針。design-v2 §6-4）。
 */
export const listSchedulePolls = async (
  repo: ListSchedulePollsRepository,
  lobbyId: string,
  userId: string | null,
): Promise<ListSchedulePollsResult> => {
  const visibility = await repo.findLobbyVisibility(lobbyId);
  if (!visibility) return { type: 'notFound' };

  if (visibility.publishedAt === null && visibility.hostUserId !== userId) {
    return { type: 'forbidden' };
  }

  const polls = await repo.findSchedulePollSummaries(lobbyId);
  return { type: 'ok', polls };
};
