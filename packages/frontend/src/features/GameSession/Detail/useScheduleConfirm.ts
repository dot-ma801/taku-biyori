import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import type { GameSessionDetail } from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';
import { confirmAvailabilityDate } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

export const useScheduleConfirm = (
  gameSessionId: string,
  gameSession: Ref<GameSessionDetail | null>,
) => {
  const authStore = useAuthStore();
  const toast = useToast();
  const loading = ref(false);

  /** ログインユーザーがセッションのホスト（作成者）かどうか */
  const isHost = computed(
    () =>
      !!gameSession.value &&
      gameSession.value.createdBy === authStore.currentUser?.id,
  );

  /** 日程確定操作が可能かどうか。ホストかつ status が scheduling のときのみ true */
  const canConfirm = computed(
    () =>
      isHost.value &&
      gameSession.value?.status === GameSessionStatus.scheduling,
  );

  /**
   * 指定した候補日を日程として確定する。
   * 成功後に gameSession の status と scheduledAt を更新する。
   * loading 中の重複呼び出しは無視する。
   */
  async function confirmDate(dateId: string) {
    if (loading.value) return;
    loading.value = true;
    try {
      const updated = await confirmAvailabilityDate(gameSessionId, dateId);
      if (gameSession.value) {
        gameSession.value = { ...gameSession.value, ...updated };
      }
    } catch {
      toast.error('日程の確定に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return { isHost, canConfirm, loading, confirmDate };
};
