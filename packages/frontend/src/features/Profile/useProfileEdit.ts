import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { ProfileResponse } from '@taku-biyori/shared';
import { updateProfile } from '@/api/profile';
import { useToast } from '@/composables/useToast';

export const useProfileEdit = (
  // NOTE: 読み取りは getter で受ける。Ref を要求すると props 境界をまたいで
  //       書き換え可能になり、依存の向き（親→子）が壊れるため。
  profile: MaybeRefOrGetter<ProfileResponse | null>,
  // NOTE: 書き込みは callback で所有者（親）に委譲する。composable は
  //       自分が所有していない状態を直接書き換えない。
  onUpdated: (updated: ProfileResponse) => void,
) => {
  const toast = useToast();
  const loading = ref(false);
  const isEditing = ref(false);

  /**
   * 編集ドラフト（表示名）。サーバ値（profile.name）とは分離して保持し、
   * 変更検知・キャンセルを成立させる。この ref はこの composable が所有する。
   */
  const draftName = ref('');

  /** サーバ由来の表示名（基準値・空文字フォールバック） */
  const baseline = computed(() => toValue(profile)?.name ?? '');

  /** ドラフトが基準値から変化しているか */
  const isDirty = computed(() => draftName.value !== baseline.value);

  /**
   * ドラフトが送信可能な状態か。
   * trim 後の値が基準値と異なり、かつ空白のみでないこと（末尾空白だけの変更で
   * no-op な PATCH を送らないよう、trim 後の値で基準値と比較する）
   */
  const canSubmit = computed(() => {
    const trimmed = draftName.value.trim();
    return trimmed.length > 0 && trimmed !== baseline.value;
  });

  /** 編集モードを開始し、現在値でドラフトを初期化する */
  function startEdit() {
    draftName.value = baseline.value;
    isEditing.value = true;
  }

  /** 編集をキャンセルして編集モードを終了する */
  function cancelEdit() {
    isEditing.value = false;
  }

  /**
   * 変更があれば表示名を送信する。失敗時は isEditing を維持したまま
   * toast.error を表示する。loading 中の重複呼び出しは無視する。
   */
  async function submitEdit() {
    if (loading.value) return;
    if (!canSubmit.value) {
      if (!isDirty.value) isEditing.value = false;
      return;
    }
    loading.value = true;

    try {
      const updated = await updateProfile({ name: draftName.value.trim() });
      onUpdated(updated);
      isEditing.value = false;
    } catch {
      toast.error('ユーザー名の更新に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return {
    isEditing,
    isDirty,
    canSubmit,
    loading,
    draftName,
    startEdit,
    cancelEdit,
    submitEdit,
  };
};
