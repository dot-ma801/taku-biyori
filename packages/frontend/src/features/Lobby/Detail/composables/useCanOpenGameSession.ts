import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { LobbyAction, canPerformLobbyAction } from '@taku-biyori/shared';
import type { LobbyDetailModel } from '@/models/lobby';
import { useAuthStore } from '@/stores/auth';

/**
 * ホストが「開催を追加する」を出せるかを導出する。
 *
 * 判定は shared の `LOBBY_ACTION_POLICIES`（API 契約）に委譲する。
 * `open` だけに絞ると、受付を閉じてから日程と参加者を決める通常の流れで
 * 導線が消えてしまう（backend は draft / open / closed のいずれでも受け付ける）。
 */
export const useCanOpenGameSession = (
  // NOTE: 読み取りは getter で受ける。Ref を要求すると props 境界をまたいで
  //       書き換え可能になり、依存の向き（親→子）が壊れるため。
  lobby: MaybeRefOrGetter<LobbyDetailModel | null>,
) => {
  const authStore = useAuthStore();

  const canOpenGameSession = computed(() => {
    const current = toValue(lobby);
    if (!current) return false;
    return (
      current.hostUserId === authStore.currentUser?.id &&
      canPerformLobbyAction(LobbyAction.openGameSession, current.status, 'host')
    );
  });

  return { canOpenGameSession };
};
