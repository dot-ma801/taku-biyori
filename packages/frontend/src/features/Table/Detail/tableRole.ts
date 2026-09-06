/**
 * 卓を見ている人の立場。
 *
 * 権限そのものは `@taku-biyori/shared` の `canPerformLobbyAction` 等が持つ。
 * ここが持つのは「画面のどこを見せるか」を決めるための粗い区分だけ。
 */
export enum TableRole {
  /** ホスト（GM）。確定・候補日編集・編集・招待リンク・その他操作ができる */
  host = 'host',
  /** 参加者（PL）。在籍中のメンバー */
  member = 'member',
  /** それ以外。未参加のログインユーザーと、未ログイン・ゲストを含む */
  guest = 'guest',
}

export const TABLE_ROLE_LABEL: Record<TableRole, string> = {
  [TableRole.host]: 'GM',
  [TableRole.member]: 'PL',
  [TableRole.guest]: 'ゲスト',
};
