import type { GameSessionMember, LobbyMember } from '@taku-biyori/shared';
import { isGuestMember } from '@taku-biyori/shared';

const UNSET = '（未設定）';

/**
 * アバター用の生の名前（サフィックスなし）。
 * vue-boring-avatars は name から色を導出するため、
 * 表示名にサフィックスを付けてもアバター色が変わらないよう分けて公開する。
 */
// FIXME: ここは汎用的な user を受け取るべきでは？
export function memberBaseName(member: GameSessionMember | LobbyMember): string {
  return member.userName ?? member.guestName ?? UNSET;
}

/**
 * メンバーの表示名。ゲスト（アカウントなし）には末尾に「（ゲスト）」を付ける。
 * 名前が未設定の場合はゲストでも「（未設定）」のみを返す。
 */
// FIXME: ここは汎用的な user を受け取るべきでは？
export function memberDisplayName(member: GameSessionMember | LobbyMember): string {
  const base = memberBaseName(member);
  if (isGuestMember(member) && base !== UNSET) {
    return `${base}（ゲスト）`;
  }
  return base;
}
