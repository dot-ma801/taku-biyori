import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import type { GameSessionDetail } from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';
import { joinGameSession } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

export const useJoinGameSession = (
  gameSessionId: string,
  gameSession: Ref<GameSessionDetail | null>,
) => {
  const authStore = useAuthStore();
  const toast = useToast();
  const loading = ref(false);

  const isMember = computed(() => {
    if (!gameSession.value) return false;
    return gameSession.value.members.some(
      (m) => m.userId === authStore.currentUser?.id,
    );
  });

  const canJoin = computed(
    () =>
      !isMember.value &&
      gameSession.value?.status === GameSessionStatus.open,
  );

  async function join() {
    if (loading.value) return;
    loading.value = true;
    try {
      const newMember = await joinGameSession(gameSessionId, {});
      if (gameSession.value) {
        gameSession.value = {
          ...gameSession.value,
          members: [...gameSession.value.members, newMember],
        };
      }
    } catch {
      toast.error('参加に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return { isMember, canJoin, loading, join };
};
