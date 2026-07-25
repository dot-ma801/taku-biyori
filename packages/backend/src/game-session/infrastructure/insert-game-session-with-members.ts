import type { GameSession } from '@taku-biyori/shared';
import type { Database } from '@/system/infrastructure/database/client';
import {
  gameSessions,
  gameSessionMembers,
} from '@/system/infrastructure/database/game-session-schema';
import { toGameSession } from '@/game-session/infrastructure/game-session-repository';

/**
 * 卓に引き継ぐメンバー1件。
 * 呼び出し側（募集枠）のメンバー型に依存しないよう、必要な項目だけを構造的に受け取る。
 */
export type GameSessionMemberSeed = {
  /** 出自の募集枠メンバーID（`lobby_member_id` に記録する） */
  id: string;
  userId: string | null;
  guestName: string | null;
};

export type InsertGameSessionWithMembersParams = {
  /** 出自の募集枠。直接卓立ての経路では使わない（design-v1.1 §3） */
  lobbyId: string;
  hostUserId: string;
  title: string;
  scenarioName: string | null;
  description: string | null;
  location: string | null;
  maxPlayers: number | null;
  scheduledAt: string;
  guestLinkToken: string;
  members: GameSessionMemberSeed[];
};

/**
 * 卓とそのメンバーを INSERT する（卓の生成は卓機能側の責務）。
 *
 * 募集枠の確定から呼ばれるが、募集枠のインフラ層が卓のテーブル定義や行の変換を
 * 直接触ると機能をまたいだ依存になるため、卓側の関数として公開する（PR #74 レビュー合意）。
 * トランザクション内で使う場合は、その `tx` を `db` として渡す。
 */
export const insertGameSessionWithMembers = async (
  db: Database,
  params: InsertGameSessionWithMembersParams,
): Promise<GameSession> => {
  const result = await db
    .insert(gameSessions)
    .values({
      hostUserId: params.hostUserId,
      title: params.title,
      scenarioName: params.scenarioName,
      description: params.description,
      location: params.location,
      maxPlayers: params.maxPlayers,
      guestLinkToken: params.guestLinkToken,
      isPublished: true,
      scheduledAt: params.scheduledAt,
      lobbyId: params.lobbyId,
    })
    .returning();

  const row = result[0];
  if (!row) throw new Error('卓の作成に失敗しました');

  if (params.members.length > 0) {
    await db.insert(gameSessionMembers).values(
      params.members.map((member) => ({
        gameSessionId: row.id,
        userId: member.userId,
        guestName: member.guestName,
        lobbyMemberId: member.id,
        characterName: null,
      })),
    );
  }

  return toGameSession(row);
};
