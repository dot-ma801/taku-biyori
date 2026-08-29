import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { LobbyEntryModel } from '@/models/lobby';
import { memberBaseName, memberDisplayName } from '@/utils/memberDisplayName';

export type DisplayEntry = {
  id: string;
  /** 表示名。ゲストには「（ゲスト）」が付く */
  userName: string;
  /** アバターの種。他画面（ヘッダー・プロフィール）と絵柄を揃えるため userId を優先する */
  userId: string | null;
  /** id を持たないゲスト向けのフォールバック。サフィックスで絵柄が変わらないよう baseName を渡す */
  baseName: string;
  /** 脱退済みか。参加者一覧でグレー表示に落とす判定に使う */
  hasLeft: boolean;
};

/**
 * 参加者一覧の表示用データを作る。
 *
 * **脱退者も取り除かない。** ロビー詳細の参加者一覧は「誰が居たか」の記録でもあるため、
 * `hasLeft` を立ててグレー表示に落とす（design-v2 §9-5）。
 * 回答表・着席候補は在籍中だけを見るので、そちらには `activeEntries` を渡す。
 *
 * 読み取りは getter で受け取り、依存の向き（親→子）を一方向に保つ。
 */
export const useEntryListView = (
  entries: MaybeRefOrGetter<LobbyEntryModel[]>,
) => {
  const displayEntries = computed<DisplayEntry[]>(() =>
    toValue(entries).map((entry) => ({
      id: entry.id,
      userName: memberDisplayName(entry),
      userId: entry.userId,
      baseName: memberBaseName(entry),
      hasLeft: entry.leftAt !== null,
    })),
  );

  return { displayEntries };
};
