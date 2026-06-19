import { ref, onMounted } from 'vue';
import { getGameSession } from '@/api/game-session';
import { ApiError } from '@/lib/api-client';
import type { GameSession, GameSessionDetail } from '@taku-biyori/shared';
import { useRouter } from 'vue-router';

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

  onMounted(fetch);

  // Partial にすることで、変化したフィールドだけを渡せる（例: confirmDate は status と scheduledAt のみ更新）
  function patchGameSession(patch: Partial<GameSession>) {
    if (gameSession.value) {
      gameSession.value = { ...gameSession.value, ...patch };
    }
  }

  const router = useRouter();
  const onClickEdit = () => {
    router.push({ name: 'game-sessions-edit', params: { gameSessionId: id } });
  };

  return {
    gameSession,
    loading,
    errorMessage,
    fetch,
    patchGameSession,
    onClickEdit,
  };
};
