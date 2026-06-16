import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import type { GameSessionDetail } from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';
import { joinGameSession, leaveGameSession } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

export const useGameSessionMembership = (
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

  const isMember = computed(() => !!myMember.value);

  const canJoin = computed(
    () =>
      !isMember.value && gameSession.value?.status === GameSessionStatus.open,
  );

  const isHost = computed(
    () => gameSession.value?.createdBy === authStore.currentUser?.id,
  );

  const canLeave = computed(
    () =>
      isMember.value &&
      !isHost.value &&
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

  return { canJoin, canLeave, loading, join, leave };
};
