import { computed, ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  type GameSessionDetail,
  type GameSessionMember,
  type SharedGameSessionPlayMemo,
  canViewSharedPlayMemos,
  isGuestMember,
} from '@taku-biyori/shared';
import { listSharedPlayMemos } from '@/api/game-session';
import { memberBaseName } from '@/utils/memberDisplayName';

/**
 * メンバー行に付けるタグ。語彙は「公開 / 非公開 / ゲスト」の3つだけ（design-v1.2 §6）。
 *
 * ゲストがメモを持てないのは本人確認の手段が無いという仕様上の帰結なので、
 * 「作成不可」のような禁止の言い方はしない。表示文言はコンポーネント側で解決する。
 */
export type PlayMemoMemberTag = 'shared' | 'private' | 'guest';

/** メンバー切り替えサイドバーの1行 */
export interface PlayMemoMemberEntry {
  memberId: string;
  /** 主ラベル。キャラ名、無ければユーザー名 */
  primaryLabel: string;
  /** 副ラベル。ユーザー名を主ラベルへ繰り上げた行では null */
  secondaryLabel: string | null;
  /** アバターの種。他画面と絵柄を揃えるため id を優先する。ゲストは持たないので null */
  userId: string | null;
  /** アバターのフォールバック名。サフィックスで絵柄が変わらないよう素の名前を使う */
  avatarName: string;
  tag: PlayMemoMemberTag;
  /**
   * 本文を読めるか。非公開の他メンバーとゲストは読めない。
   *
   * 「選べるか」ではない点に注意。読めない相手も選べて、本文の代わりに
   * 読めない理由を出す（黙って選択が戻ると、押しても何も起きないように見えるため）。
   */
  readable: boolean;
  isMe: boolean;
  /** その人の公開メモ。非公開・ゲストは null（自分の非公開メモもここには載らない） */
  sharedPlayMemo: SharedGameSessionPlayMemo | null;
}

/**
 * 卓の公開プレイメモを取得し、メンバーと突き合わせてサイドバーの行を組み立てる composable。
 *
 * 一覧（sharedPlayMemos）の所有者はこの composable 自身なので、内部で `.value =` してよい。
 * 卓・自分のメンバー ID は所有者が別に居るため getter で読むだけにする（CLAUDE.md）。
 */
export const useSharedPlayMemos = (
  gameSessionId: string,
  gameSession: MaybeRefOrGetter<GameSessionDetail | null>,
  // メンバーでない閲覧者（未ログイン・ゲスト）は null
  myMemberId: MaybeRefOrGetter<string | null | undefined>,
) => {
  const sharedPlayMemos = ref<SharedGameSessionPlayMemo[]>([]);
  const loading = ref(false);

  /**
   * 他メンバーの公開メモを読めるステータスか。
   *
   * 閲覧者のロールでは分岐しない（未ログイン・ゲストも含めて誰でも読める）。
   * 判定は shared の `canViewSharedPlayMemos` に委ね、バックエンドと同じ表を使う。
   */
  const canViewShared = computed(() => {
    const status = toValue(gameSession)?.status;
    return status !== undefined && canViewSharedPlayMemos(status);
  });

  /**
   * 公開メモ一覧を取得する。
   *
   * 完了・中止の前は1件も返らないため通信しない。非公開卓を第三者が開いた場合は
   * 403 が返るが、メモは画面の主目的ではないので空のまま黙って閉じる。
   */
  async function fetch(): Promise<void> {
    if (!canViewShared.value) return;

    loading.value = true;
    try {
      sharedPlayMemos.value = await listSharedPlayMemos(gameSessionId);
    } catch {
      sharedPlayMemos.value = [];
    } finally {
      loading.value = false;
    }
  }

  // 卓が後から届く経路（メモ画面）と、完了して読めるようになる経路の両方を
  // 拾うため、「読めるようになったか」を監視して取得する。
  watch(
    canViewShared,
    (canView) => {
      if (!canView) return;
      void fetch();
    },
    { immediate: true },
  );

  const sharedPlayMemoByMemberId = computed(
    () => new Map(sharedPlayMemos.value.map((memo) => [memo.memberId, memo])),
  );

  /**
   * メンバー1人分の行を組み立てる。
   *
   * ゲストは `user_id = null` でメモを持てないため、公開メモの有無を見るまでもなく
   * ゲストのタグに倒す。自分だけは非公開でも開ける（本人はいつでも読める）。
   */
  function toEntry(member: GameSessionMember): PlayMemoMemberEntry {
    const isMe = member.id === toValue(myMemberId);
    const sharedPlayMemo =
      sharedPlayMemoByMemberId.value.get(member.id) ?? null;
    const isGuest = isGuestMember(member);

    // タグが「ゲスト」を示すので、名前には「（ゲスト）」を付けない（重複するため）
    const userLabel = memberBaseName(member);

    return {
      memberId: member.id,
      primaryLabel: member.characterName ?? userLabel,
      secondaryLabel: member.characterName ? userLabel : null,
      userId: member.userId,
      avatarName: userLabel,
      tag: isGuest ? 'guest' : sharedPlayMemo ? 'shared' : 'private',
      readable: !isGuest && (!!sharedPlayMemo || isMe),
      isMe,
      sharedPlayMemo,
    };
  }

  /** サイドバーに並べる参加メンバー全員。読めない相手も理由（タグ）付きで並べる */
  const entries = computed<PlayMemoMemberEntry[]>(
    () => toValue(gameSession)?.members.map(toEntry) ?? [],
  );

  /**
   * 自分を除いた公開メモの件数。
   *
   * 一覧は閲覧者で分岐せず自分の公開メモも含めて返るため、「ほかのメンバー」を
   * 数えるにはフロント側で自分を取り除く必要がある（design-v1.2 §8）。
   */
  const othersSharedCount = computed(
    () =>
      sharedPlayMemos.value.filter(
        (memo) => memo.memberId !== toValue(myMemberId),
      ).length,
  );

  return {
    sharedPlayMemos,
    loading,
    canViewShared,
    entries,
    othersSharedCount,
    fetch,
  };
};
