import { computed, toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { PlayMemoMemberEntry } from '@/features/GameSession/PlayMemo/useSharedPlayMemos';

/**
 * メモ画面で「誰のメモを開いているか」を受け持つ composable。
 *
 * 選択は `?member=<memberId>` で URL に載せる（リロード・共有・戻るで同じメモに戻れる）。
 * 状態を自前で持たず URL を唯一の真実にするため、この composable は ref を所有しない。
 */
export const usePlayMemoSelection = (
  entries: MaybeRefOrGetter<PlayMemoMemberEntry[]>,
) => {
  const route = useRoute();
  const router = useRouter();

  /** URL で指定されたメンバー。配列・空文字は指定なしとして扱う */
  const requestedMemberId = computed(() => {
    const raw = route.query.member;
    return typeof raw === 'string' && raw.length > 0 ? raw : null;
  });

  /**
   * 指定が無いときの選択。メンバーは自分、それ以外は先頭の公開メモ（design-v1.2 §6）。
   *
   * 既定では読めない相手を開かない。読めない行は「押されたときだけ」開いて理由を出す。
   */
  const defaultEntry = computed(() => {
    const list = toValue(entries);
    return (
      list.find((entry) => entry.isMe && entry.readable) ??
      list.find((entry) => entry.readable) ??
      null
    );
  });

  /**
   * 選択中のメンバー行。
   *
   * 読めない相手（非公開・ゲスト）も選べる。本文の代わりに読めない理由を出すため、
   * ここで既定へ落としてはいけない（落とすと押しても何も起きないように見える）。
   * 落とすのは卓に居ないメンバー ID を指定されたときだけ。
   */
  const selectedEntry = computed(() => {
    const requested = toValue(entries).find(
      (entry) => entry.memberId === requestedMemberId.value,
    );
    return requested ?? defaultEntry.value;
  });

  const selectedMemberId = computed(
    () => selectedEntry.value?.memberId ?? null,
  );

  /** 自分のメモを開いているか。編集面と公開トグルを出すかの判断に使う */
  const isMineSelected = computed(() => !!selectedEntry.value?.isMe);

  /** メンバーを切り替える。履歴に積んでブラウザバックで前のメモに戻れるようにする */
  function select(memberId: string): void {
    void router.push({ query: { ...route.query, member: memberId } });
  }

  // 卓に居ないメンバー ID を指定された場合は、実際の選択に URL を合わせる。
  // 履歴を汚さないよう replace で落とす（design-v1.2 §6）。
  watch(
    [requestedMemberId, selectedMemberId, () => toValue(entries).length],
    ([requested, selected, memberCount]) => {
      // メンバーがまだ届いていない間は「読めない相手」と区別できないため何もしない。
      // 読み込みが終われば entries の変化でこの watch がもう一度走る
      if (requested === null || memberCount === 0) return;
      if (requested === selected) return;

      const query = { ...route.query };
      if (selected === null) {
        delete query.member;
      } else {
        query.member = selected;
      }
      void router.replace({ query });
    },
    { immediate: true },
  );

  return {
    selectedEntry,
    selectedMemberId,
    isMineSelected,
    select,
  };
};
