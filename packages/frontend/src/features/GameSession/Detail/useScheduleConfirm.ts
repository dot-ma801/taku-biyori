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

  const isHost = computed(
    () =>
      !!gameSession.value &&
      gameSession.value.createdBy === authStore.currentUser?.id,
  );

  const canConfirm = computed(
    () =>
      isHost.value &&
      gameSession.value?.status === GameSessionStatus.scheduling,
  );

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
