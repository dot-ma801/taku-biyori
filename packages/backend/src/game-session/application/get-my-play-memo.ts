import type {
  GameSessionPlayMemo,
  MyGameSessionPlayMemo,
} from '@taku-biyori/shared';

export interface GetMyPlayMemoRepository {
  gameSessionExists(id: string): Promise<boolean>;
  findSeatByUserId(
    gameSessionId: string,
    userId: string,
  ): Promise<string | null>;
  findPlayMemoBySeatId(seatId: string): Promise<GameSessionPlayMemo | null>;
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

  // 認証ユーザー ID で着席を引く。ゲストは LobbyEntry の user_id = null のため
  // 構造上ヒットせず、ゲスト除外の専用分岐は不要（design-v1.2 §4）
  const seatId = await repo.findSeatByUserId(gameSessionId, userId);
  if (seatId === null) return { type: 'forbidden' };

  const playMemo = await repo.findPlayMemoBySeatId(seatId);
  // 未作成でも 404 にせず空メモを返す。フロントに「エラー」と
  // 「まだ書いていない」の分岐を作らせない（design-v1.2 §8）
  return {
    type: 'ok',
    playMemo: playMemo ?? {
      // memberId というキー名は契約のまま据え置く。中身は seats.id で、
      // seatId への改名はタスク6（#116）で行う（design-v2 §6-15）
      memberId: seatId,
      body: '',
      sharedAt: null,
      updatedAt: null,
    },
  };
};
