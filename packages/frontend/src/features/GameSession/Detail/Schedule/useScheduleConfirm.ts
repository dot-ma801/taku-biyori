import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { GameSession } from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';
import { confirmAvailabilityDate } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

export const useScheduleConfirm = (
  gameSessionId: string,
  // NOTE: 1. getter で受け取る
  createdBy: MaybeRefOrGetter<string>,
  status: MaybeRefOrGetter<GameSessionStatus | undefined>,
  onConfirmed: (updated: GameSession) => void,
) => {
  const authStore = useAuthStore();
  const toast = useToast();
  const loading = ref(false);

  const isHost = computed(
    // NOTE: 2. toValue で値を取り出して computed で監視する
    // この書き方をしないと、使用側で中間 props を監視する中間 computed が必要になる
    () => toValue(createdBy) === authStore.currentUser?.id,
  );

  /** 日程確定操作が可能かどうか。ホストかつ status が scheduling のときのみ true */
  const canConfirm = computed(
    () => isHost.value && toValue(status) === GameSessionStatus.scheduling,
  );

  /**
   * 指定した候補日を日程として確定する。
   * 成功後に onConfirmed コールバックを呼び出す。
   * loading 中の重複呼び出しは無視する。
   */
  async function confirmDate(dateId: string) {
    if (loading.value) return;
    loading.value = true;
    try {
      const updated = await confirmAvailabilityDate(gameSessionId, dateId);
      onConfirmed(updated);
    } catch {
      toast.error('日程の確定に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return { canConfirm, loading, confirmDate };
};
