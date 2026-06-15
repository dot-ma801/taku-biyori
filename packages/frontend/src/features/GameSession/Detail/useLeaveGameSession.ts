import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import type { GameSessionDetail } from '@taku-biyori/shared';
import { leaveGameSession } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

export const useLeaveGameSession = (
  gameSessionId: string,
  gameSession: Ref<GameSessionDetail | null>,
) => {
  const authStore = useAuthStore();
  const toast = useToast();
  const loading = ref(false);

  const myMember = computed(() =>
    gameSession.value?.members.find(
      (m) => m.userId === authStore.currentUser?.id,
    ),
  );

  const canLeave = computed(() => !!myMember.value);

  async function leave() {
    if (loading.value || !myMember.value) return;
    loading.value = true;
    const memberId = myMember.value.id;
    try {
      await leaveGameSession(gameSessionId, memberId);
      if (gameSession.value) {
        gameSession.value = {
          ...gameSession.value,
          members: gameSession.value.members.filter((m) => m.id !== memberId),
        };
      }
    } catch {
      toast.error('退出に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return { canLeave, loading, leave };
};
