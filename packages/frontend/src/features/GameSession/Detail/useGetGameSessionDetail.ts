import { ref } from 'vue';
import { getGameSession } from '@/api/game-session';
import { ApiError } from '@/lib/api-client';
import type { GameSessionDetail } from '@taku-biyori/shared';

export const useGetGameSessionDetail = (id: string) => {
  const gameSession = ref<GameSessionDetail | null>(null);
  const loading = ref(false);
  const errorMessage = ref('');

  async function fetch() {
    loading.value = true;
    errorMessage.value = '';

    try {
      gameSession.value = await getGameSession(id);
    } catch (err) {
      if (err instanceof ApiError) {
        errorMessage.value = err.message;
      } else {
        errorMessage.value = 'エラーが発生しました';
      }
    } finally {
      loading.value = false;
    }
  }

  return {
    gameSession,
    loading,
    errorMessage,
    fetch,
  };
};
