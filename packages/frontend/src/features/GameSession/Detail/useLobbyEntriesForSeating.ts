import { ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { getLobby } from '@/api/lobby';
import type { LobbyEntryModel } from '@/models/lobby';
import { useAuthStore } from '@/stores/auth';

/**
 * 着席候補（ロビーの在籍者）を取得する。
 *
 * セッション詳細のレスポンスは `lobby` を要約（`LobbySummary`）でしか持たず
 * 参加者一覧を含まない（重くなるため。design-v2 §6-13-5）。
 * 着席させられるのはホストだけなので、**ホストのときだけ**ロビーを引く。
 *
 * 詳細の取得が終わるまでホストかどうかは分からないので、`onMounted` ではなく
 * `hostUserId` の変化を watch して引く。
 *
 * 失敗しても画面は壊さない。着席候補が出ないだけで、詳細の表示は続けられる。
 */
export const useLobbyEntriesForSeating = (
  lobbyId: string,
  hostUserId: MaybeRefOrGetter<string | undefined>,
) => {
  const authStore = useAuthStore();
  const activeEntries = ref<LobbyEntryModel[]>([]);

  async function fetch() {
    const currentUserId = authStore.currentUser?.id;
    if (!currentUserId || toValue(hostUserId) !== currentUserId) return;

    try {
      const lobby = await getLobby(lobbyId);
      activeEntries.value = lobby.activeEntries;
    } catch {
      activeEntries.value = [];
    }
  }

  // 詳細が届いて hostUserId が確定した時点で1回引く
  watch(() => toValue(hostUserId), fetch, { immediate: true });

  return { activeEntries, fetch };
};
