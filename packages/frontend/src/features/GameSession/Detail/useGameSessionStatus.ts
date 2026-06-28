import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import { useRouter } from 'vue-router';
import type { GameSessionDetail } from '@taku-biyori/shared';
import {
  GameSessionStatus,
  GameSessionAction,
  canPerform,
} from '@taku-biyori/shared';
import {
  deleteGameSession,
  updateGameSessionStatus,
} from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

export const useGameSessionStatus = (
  gameSessionId: string,
  gameSession: Ref<GameSessionDetail | null>,
) => {
  const authStore = useAuthStore();
  const toast = useToast();
  const router = useRouter();

  /** ステータス遷移（公開・完了）処理中かどうか */
  const loading = ref(false);
  /** 削除処理中かどうか。ステータス遷移とは独立して扱う */
  const loadingDelete = ref(false);

  /** ログインユーザーがこのセッションのホストか */
  const isHost = computed(
    () =>
      !!gameSession.value &&
      gameSession.value.createdBy === authStore.currentUser?.id,
  );

  /** 公開可能か。ホストかつ status が draft のときのみ true */
  const canPublish = computed(
    () => isHost.value && gameSession.value?.status === GameSessionStatus.draft,
  );

  /** 完了可能か。ホストかつ status が today のときのみ true */
  const canComplete = computed(
    () => isHost.value && gameSession.value?.status === GameSessionStatus.today,
  );

  /**
   * 削除可能か。次の全条件を満たすときのみ true。
   * - ホストである（削除 API がホスト限定）
   * - ステータスが ACTION_POLICIES の deleteSession に含まれる
   *   （draft / open / scheduling。confirmed 以降は参加者の予定が確定しているため不可）
   * - 自分以外のメンバーがいない（参加者がいる卓を勝手に消さない）
   */
  const canDelete = computed(() => {
    const session = gameSession.value;
    if (!session) {
      return false;
    }
    if (!canPerform(GameSessionAction.deleteSession, session.status, 'host')) {
      return false;
    }
    if (!isHost.value) {
      return false;
    }
    const others = session.members.filter(
      (m) => m.userId !== authStore.currentUser?.id,
    );
    return others.length === 0;
  });

  /**
   * 卓を公開する（draft → open）。
   * 成功後に gameSession を更新する。
   * loading 中の重複呼び出しは無視する。
   */
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

  /**
   * 卓を完了する（today → completed）。
   * 成功後に gameSession を更新する。
   * loading 中の重複呼び出しは無視する。
   */
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

  /**
   * 卓を削除する。成功後は卓一覧ページへ遷移する。
   * 削除可否を満たさない場合・loadingDelete 中の重複呼び出しは無視する。
   */
  async function deleteSession() {
    if (loadingDelete.value || !canDelete.value) {
      return;
    }
    loadingDelete.value = true;
    try {
      await deleteGameSession(gameSessionId);
      toast.success('卓を削除しました');
      router.push({ name: 'game-sessions-list' });
    } catch {
      toast.error('卓の削除に失敗しました');
    } finally {
      loadingDelete.value = false;
    }
  }

  return {
    isHost,
    canPublish,
    canComplete,
    canDelete,
    loading,
    loadingDelete,
    publishSession,
    completeSession,
    deleteSession,
  };
};
