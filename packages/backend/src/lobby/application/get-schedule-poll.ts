import type { LobbySchedulePoll } from '@taku-biyori/shared';

export interface GetSchedulePollRepository {
  findLobbyVisibility(
    id: string,
  ): Promise<{ publishedAt: Date | null; hostUserId: string } | null>;
  /** 脱退者の回答も含めて返す。過去の記録として残すため消さない（design-v2 §9-5） */
  findSchedulePollWithAnswers(
    pollId: string,
  ): Promise<LobbySchedulePoll | null>;
}

export type GetSchedulePollResult =
  | { type: 'ok'; poll: LobbySchedulePoll }
  | { type: 'notFound' }
  | { type: 'forbidden' };

/**
 * 日程調整1件を回答つきで取得する。公開済みの募集枠は誰でも閲覧できる。
 * 非公開（draft）はホストのみ（listEntries と同方針。design-v2 §6-4）。
 * 指定 pollId が別ロビーのものだった場合も notFound とし、他ロビーの ID の存在を漏らさない。
 */
export const getSchedulePoll = async (
  repo: GetSchedulePollRepository,
  lobbyId: string,
  pollId: string,
  userId: string | null,
): Promise<GetSchedulePollResult> => {
  const visibility = await repo.findLobbyVisibility(lobbyId);
  if (!visibility) return { type: 'notFound' };

  if (visibility.publishedAt === null && visibility.hostUserId !== userId) {
    return { type: 'forbidden' };
  }

  const poll = await repo.findSchedulePollWithAnswers(pollId);
  if (!poll || poll.lobbyId !== lobbyId) return { type: 'notFound' };

  return { type: 'ok', poll };
};
