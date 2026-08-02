import type {
  GameSessionPlayMemo,
  MyGameSessionPlayMemo,
} from '@taku-biyori/shared';

export interface GetMyPlayMemoRepository {
  gameSessionExists(id: string): Promise<boolean>;
  findMemberByUserId(
    gameSessionId: string,
    userId: string,
  ): Promise<string | null>;
  findPlayMemoByMemberId(memberId: string): Promise<GameSessionPlayMemo | null>;
}

export type GetMyPlayMemoResult =
  | { type: 'ok'; playMemo: MyGameSessionPlayMemo }
  | { type: 'notFound' }
  | { type: 'forbidden' };

/**
 * 自分のプレイメモを取得する（design-v1.2 §5）。
 *
 * 卓のステータスには依存しない。本文の編集は完了・中止で閉じるが、
 * 自分のメモの閲覧は全ステータスで可能（design-v1.2 §4 の操作可否表）。
 */
export const getMyPlayMemo = async (
  repo: GetMyPlayMemoRepository,
  gameSessionId: string,
  userId: string,
): Promise<GetMyPlayMemoResult> => {
  const exists = await repo.gameSessionExists(gameSessionId);
  if (!exists) return { type: 'notFound' };

  // 認証ユーザー ID でメンバー行を引く。ゲストは user_id = null のため
  // 構造上ヒットせず、ゲスト除外の専用分岐は不要（design-v1.2 §4）
  const memberId = await repo.findMemberByUserId(gameSessionId, userId);
  if (memberId === null) return { type: 'forbidden' };

  const playMemo = await repo.findPlayMemoByMemberId(memberId);
  // 未作成でも 404 にせず空メモを返す。フロントに「エラー」と
  // 「まだ書いていない」の分岐を作らせない（design-v1.2 §8）
  return {
    type: 'ok',
    playMemo: playMemo ?? {
      memberId,
      body: '',
      sharedAt: null,
      updatedAt: null,
    },
  };
};
