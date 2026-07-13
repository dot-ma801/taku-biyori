import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { LobbyStatus } from '@taku-biyori/shared';
import { useAuthStore } from '@/stores/auth';

/**
 * Lobby の日程確定操作に関する権限判定を扱う composable。
 *
 * Lobby には候補日単体の確定 API が存在しないため（確定は Issue #62 の
 * `POST /:id/confirm` で日程とメンバー選出を不可分に行う）、
 * 実際の確定処理（API 呼び出し）は持たず、権限判定のみを提供する。
 */
export const useScheduleConfirm = (
  hostUserId: MaybeRefOrGetter<string>,
  status: MaybeRefOrGetter<LobbyStatus | undefined>,
) => {
  const authStore = useAuthStore();

  /** ログインユーザーがホストかどうか */
  const isHost = computed(
    () => toValue(hostUserId) === authStore.currentUser?.id,
  );

  /** 日程確定操作が可能かどうか。ホストかつ status が open または scheduling のときのみ true */
  const canConfirm = computed(() => {
    const currentStatus = toValue(status);
    return (
      isHost.value &&
      (currentStatus === LobbyStatus.open ||
        currentStatus === LobbyStatus.scheduling)
    );
  });

  return { isHost, canConfirm };
};
