import type {
  GameSessionPlayMemo,
  UpdateGameSessionPlayMemoVisibilityInput,
} from '@taku-biyori/shared';

export interface UpdateMyPlayMemoVisibilityRepository {
  gameSessionExists(id: string): Promise<boolean>;
  findMemberByUserId(
    gameSessionId: string,
    userId: string,
  ): Promise<string | null>;
  updatePlayMemoVisibility(
    memberId: string,
    sharedAt: Date | null,
  ): Promise<GameSessionPlayMemo | null>;
}

export type UpdateMyPlayMemoVisibilityResult =
  | { type: 'ok'; playMemo: GameSessionPlayMemo }
  | { type: 'notFound' }
  | { type: 'forbidden' };

/**
 * 自分のプレイメモの公開・非公開を切り替える（design-v1.2 §5）。
 *
 * 本文の編集と違い**全ステータスで許可する**。完了・中止後こそ「遊んだ後に公開する」
 * ために使われる操作であるため（design-v1.2 §4 の操作可否表）。
 * ステータス非依存であることを、ステータスを読まないことで表現している。
 */
export const updateMyPlayMemoVisibility = async (
  repo: UpdateMyPlayMemoVisibilityRepository,
  gameSessionId: string,
  userId: string,
  input: UpdateGameSessionPlayMemoVisibilityInput,
  now: Date = new Date(),
): Promise<UpdateMyPlayMemoVisibilityResult> => {
  const exists = await repo.gameSessionExists(gameSessionId);
  if (!exists) return { type: 'notFound' };

  // 認証ユーザー ID でメンバー行を引く。ゲストは user_id = null のため
  // 構造上ヒットせず、ゲスト除外の専用分岐は不要（design-v1.2 §4）
  const memberId = await repo.findMemberByUserId(gameSessionId, userId);
  if (memberId === null) return { type: 'forbidden' };

  const playMemo = await repo.updatePlayMemoVisibility(
    memberId,
    input.shared ? now : null,
  );
  // 本文を一度も保存していないメモを公開する意味がないため 404 にする（design-v1.2 §5）
  if (playMemo === null) return { type: 'notFound' };

  return { type: 'ok', playMemo };
};
