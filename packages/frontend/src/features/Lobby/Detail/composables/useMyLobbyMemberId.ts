import { computed, getCurrentInstance, onUnmounted, ref, toValue } from 'vue';
import type { ComputedRef, MaybeRefOrGetter } from 'vue';
import type { LobbyEntryModel } from '@/models/lobby';
import { useSession } from '@/lib/auth';

/**
 * ログインユーザーに対応する自分の LobbyEntry の id を導出する composable。
 * 日程調整表（自分の列編集）や参加/退出ボタンから利用する想定。
 */
export const useMyLobbyMemberId = (
  members: MaybeRefOrGetter<LobbyEntryModel[]>,
): {
  myMemberId: ComputedRef<string | null>;
  isJoined: ComputedRef<boolean>;
} => {
  // useSession は nanostores の Atom なので Vue の ref に変換する
  const sessionData = ref(useSession.get());
  const unsubscribeSession = useSession.subscribe((v) => {
    sessionData.value = v;
  });

  // コンポーネント外（テスト等）から呼ばれた場合は onUnmounted を登録しない
  if (getCurrentInstance()) {
    onUnmounted(() => {
      unsubscribeSession();
    });
  }

  /** ログインユーザーに対応する LobbyEntry の id。未ログイン・未参加なら null */
  const myMemberId = computed<string | null>(() => {
    const userId = sessionData.value.data?.user?.id;
    if (!userId) return null;
    return toValue(members).find((m) => m.userId === userId)?.id ?? null;
  });

  /** ログインユーザーが対象の Lobby に参加済みかどうか */
  const isJoined = computed(() => myMemberId.value !== null);

  return { myMemberId, isJoined };
};
