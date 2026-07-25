import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  type GameSessionDetail,
  GameSessionAction,
  canPerform,
} from '@taku-biyori/shared';
import { joinGameSession, leaveGameSession } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

export const useGameSessionMembership = (
  gameSessionId: string,
  // NOTE: 読み取りは getter で受ける。Ref を要求すると props 境界をまたいで
  //       書き換え可能になり、依存の向き（親→子）が壊れるため。
  gameSession: MaybeRefOrGetter<GameSessionDetail | null>,
  // NOTE: 変更後の再取得を呼び出し元に委譲する。
  onRefresh: () => void,
) => {
  const authStore = useAuthStore();
  const toast = useToast();
  const loading = ref(false);

  const myMember = computed(() =>
    toValue(gameSession)?.members.find(
      (m) => m.userId === authStore.currentUser?.id,
    ),
  );

  const isMember = computed(() => !!myMember.value);

  /**
   * 参加ボタンを表示できるか。未参加かつ shared の ACTION_POLICIES が
   * joinSession を許可するステータス（confirmed / today）のときのみ true。
   * 判定は API 契約（canPerform）に委譲し、参加 API のバリデーションと同じ表を使う。
   */
  const canJoin = computed(() => {
    const status = toValue(gameSession)?.status;
    if (status === undefined) {
      return false;
    }
    return (
      !isMember.value &&
      canPerform(GameSessionAction.joinSession, status, 'member')
    );
  });

  const isHost = computed(
    () => toValue(gameSession)?.createdBy === authStore.currentUser?.id,
  );

  /**
   * 退出ボタンを表示できるか。参加済みかつ非ホストで、shared の ACTION_POLICIES が
   * leaveSession を許可するステータス（confirmed / today）のときのみ true。
   * ホストは退出ではなく中止・削除で卓を畳むため対象外。
   */
  const canLeave = computed(() => {
    const status = toValue(gameSession)?.status;
    if (status === undefined) {
      return false;
    }
    return (
      isMember.value &&
      !isHost.value &&
      canPerform(GameSessionAction.leaveSession, status, 'member')
    );
  });

  async function join() {
    if (loading.value) return;
    loading.value = true;
    try {
      await joinGameSession(gameSessionId, {});
      onRefresh();
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
      onRefresh();
    } catch {
      toast.error('退出に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return { canJoin, canLeave, loading, join, leave };
};
