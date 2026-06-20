import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { GameSessionMember } from '@taku-biyori/shared';
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
  // NOTE: 読み取りは getter で受ける。Ref を要求すると props 境界をまたいで
  //       書き換え可能になり、依存の向き（親→子）が壊れるため。
  members: MaybeRefOrGetter<GameSessionMember[]>,
  status: MaybeRefOrGetter<GameSessionStatus | undefined>,
  // NOTE: 書き込みは callback で所有者（親）に委譲する。composable は
  //       自分が所有していない状態を直接書き換えない。
  onUpdated: (updated: GameSessionMember) => void,
) => {
  const authStore = useAuthStore();
  const toast = useToast();
  const loading = ref(false);
  const isEditing = ref(false);
  const draftCharacterName = ref('');

  /** ログインユーザー自身のメンバー情報 */
  const myMember = computed(() =>
    toValue(members).find((m) => m.userId === authStore.currentUser?.id),
  );

  /** キャラクター名を編集できるか。メンバー登録済みかつセッションが進行中のとき true */
  const canEditCharacterName = computed(() => {
    const currentStatus = toValue(status);
    return (
      !!myMember.value &&
      currentStatus !== undefined &&
      EDITABLE_STATUSES.has(currentStatus)
    );
  });

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
   * 成功後に onUpdated コールバックで更新後メンバーを所有者へ渡し、編集モードを終了する。
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
      onUpdated(updated);
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
