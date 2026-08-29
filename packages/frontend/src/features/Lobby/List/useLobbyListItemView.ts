import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { LobbyListItemModel } from '@/models/lobby';

export type LobbyListItemView = LobbyListItemModel & {
  /** 在籍中の人数。脱退者は数えない */
  activeEntryCount: number;
  /** 定員の表示値。未設定なら `-` */
  formattedMaxPlayers: number | string;
  /** 残り枠。定員が未設定なら null（表示しない） */
  remainingCount: number | null;
};

/**
 * ロビー一覧の表示用データを作る。
 *
 * 「在籍中を数える」「定員が無いときどう見せる」という規則を1か所に集める。
 * 自分のロビー・公開ロビーの両方の一覧が同じ規則で表示できるようにするため、
 * コンポーネント側では導出せずここに寄せる。
 *
 * 読み取りは getter で受け取り、依存の向き（親→子）を一方向に保つ。
 */
export const useLobbyListItemView = (
  lobbies: MaybeRefOrGetter<LobbyListItemModel[]>,
) => {
  const items = computed<LobbyListItemView[]>(() =>
    toValue(lobbies).map((lobby) => {
      const activeEntryCount = lobby.activeEntries.length;

      return {
        ...lobby,
        activeEntryCount,
        formattedMaxPlayers: lobby.maxPlayers ?? '-',
        // 定員を下げた直後などに在籍数が定員を上回りうる。負の残り枠は出さない
        remainingCount:
          lobby.maxPlayers === null
            ? null
            : Math.max(0, lobby.maxPlayers - activeEntryCount),
      };
    }),
  );

  return { items };
};
