import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import type { GameSessionDetail } from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';
import { updateGameSessionStatus } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';

export const useGameSessionStatus = (
  gameSessionId: string,
  gameSession: Ref<GameSessionDetail | null>,
) => {
  const authStore = useAuthStore();
  const loading = ref(false);
  const errorMessage = ref('');

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
    loading.value = true;
    errorMessage.value = '';
    try {
      const updated = await updateGameSessionStatus(gameSessionId, {
        status: 'open',
      });
      if (gameSession.value) {
        gameSession.value = { ...gameSession.value, ...updated };
      }
    } catch {
      errorMessage.value = '公開に失敗しました';
    } finally {
      loading.value = false;
    }
  }

  async function completeSession() {
    loading.value = true;
    errorMessage.value = '';
    try {
      const updated = await updateGameSessionStatus(gameSessionId, {
        status: 'completed',
      });
      if (gameSession.value) {
        gameSession.value = { ...gameSession.value, ...updated };
      }
    } catch {
      errorMessage.value = '完了への変更に失敗しました';
    } finally {
      loading.value = false;
    }
  }

  return {
    isHost,
    canPublish,
    canComplete,
    loading,
    errorMessage,
    publishSession,
    completeSession,
  };
};
