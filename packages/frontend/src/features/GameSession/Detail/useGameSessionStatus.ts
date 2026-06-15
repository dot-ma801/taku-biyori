import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import type { GameSessionDetail } from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';
import { updateGameSessionStatus } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

export const useGameSessionStatus = (
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

  const canPublish = computed(
    () => isHost.value && gameSession.value?.status === GameSessionStatus.draft,
  );

  const canComplete = computed(
    () => isHost.value && gameSession.value?.status === GameSessionStatus.today,
  );

  async function publishSession() {
    if (loading.value) return;
    loading.value = true;
    try {
      const updated = await updateGameSessionStatus(gameSessionId, {
        status: 'open',
      });
      if (gameSession.value) {
        gameSession.value = { ...gameSession.value, ...updated };
      }
    } catch {
      toast.error('公開に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  async function completeSession() {
    if (loading.value) return;
    loading.value = true;
    try {
      const updated = await updateGameSessionStatus(gameSessionId, {
        status: 'completed',
      });
      if (gameSession.value) {
        gameSession.value = { ...gameSession.value, ...updated };
      }
    } catch {
      toast.error('完了への変更に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return {
    isHost,
    canPublish,
    canComplete,
    loading,
    publishSession,
    completeSession,
  };
};
