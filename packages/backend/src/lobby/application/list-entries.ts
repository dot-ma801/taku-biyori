import type { LobbyEntry } from '@taku-biyori/shared';

export interface ListEntriesRepository {
  findLobbyVisibility(
    id: string,
  ): Promise<{ publishedAt: Date | null; hostUserId: string } | null>;
  /** 参加者一覧。**脱退者も含めて全件返す**（design-v2 §6-3） */
  findEntriesByLobbyId(lobbyId: string): Promise<LobbyEntry[]>;
}

export type ListEntriesResult =
  | { type: 'ok'; entries: LobbyEntry[] }
  | { type: 'notFound' }
  | { type: 'forbidden' };

/**
 * 公開済みのロビーは誰でも参加者一覧を閲覧できる。
 * 未公開（draft）はホストのみ。可視性はステータスではなく published_at ファクトで判定する。
 */
export const listEntries = async (
  repo: ListEntriesRepository,
  lobbyId: string,
  userId: string | null,
): Promise<ListEntriesResult> => {
  const visibility = await repo.findLobbyVisibility(lobbyId);
  if (!visibility) return { type: 'notFound' };

  if (visibility.publishedAt === null && visibility.hostUserId !== userId) {
    return { type: 'forbidden' };
  }

  const entries = await repo.findEntriesByLobbyId(lobbyId);
  return { type: 'ok', entries };
};
