import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import type { GameSessionDetail } from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';
import { updateMember } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

const EDITABLE_STATUSES = new Set<GameSessionStatus>([
  GameSessionStatus.open,
  GameSessionStatus.scheduling,
  GameSessionStatus.confirmed,
  GameSessionStatus.today,
]);

export const useMemberEdit = (
  gameSessionId: string,
  gameSession: Ref<GameSessionDetail | null>,
) => {
  const authStore = useAuthStore();
  const toast = useToast();
  const loading = ref(false);
  const isEditing = ref(false);
  const draftCharacterName = ref('');

  /** ログインユーザー自身のメンバー情報 */
  const myMember = computed(() =>
    gameSession.value?.members.find(
      (m) => m.userId === authStore.currentUser?.id,
    ),
  );

  /** キャラクター名を編集できるか。メンバー登録済みかつセッションが進行中のとき true */
  const canEditCharacterName = computed(
    () =>
      !!myMember.value &&
      !!gameSession.value &&
      EDITABLE_STATUSES.has(gameSession.value.status),
  );

  /** 編集モードを開始し、現在のキャラクター名で下書きを初期化する */
  function startEdit() {
    draftCharacterName.value = myMember.value?.characterName ?? '';
    isEditing.value = true;
  }

  /** 編集をキャンセルして編集モードを終了する */
  function cancelEdit() {
    isEditing.value = false;
  }

  /**
   * キャラクター名の変更を送信する。
   * 成功後に gameSession のメンバー情報を更新し、編集モードを終了する。
   * 失敗時は isEditing を維持したまま toast.error を表示する。
   * loading 中の重複呼び出しは無視する。
   */
  async function submitEdit() {
    if (loading.value || !myMember.value) return;
    loading.value = true;
    const memberId = myMember.value.id;
    try {
      const updated = await updateMember(gameSessionId, memberId, {
        characterName: draftCharacterName.value || null,
      });
      if (gameSession.value) {
        gameSession.value = {
          ...gameSession.value,
          members: gameSession.value.members.map((m) =>
            m.id === memberId ? updated : m,
          ),
        };
      }
      isEditing.value = false;
    } catch {
      toast.error('キャラクター名の更新に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return {
    myMember,
    canEditCharacterName,
    isEditing,
    draftCharacterName,
    loading,
    startEdit,
    cancelEdit,
    submitEdit,
  };
};
