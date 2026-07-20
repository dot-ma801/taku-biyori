import { computed, ref } from 'vue';
import { changePassword } from '@/lib/auth';
import { useToast } from '@/composables/useToast';

const MIN_PASSWORD_LENGTH = 8;

export const usePasswordChange = () => {
  const toast = useToast();
  const loading = ref(false);
  const isEditing = ref(false);

  const currentPassword = ref('');
  const newPassword = ref('');
  const confirmPassword = ref('');

  const canSubmit = computed(
    () =>
      currentPassword.value.length > 0 &&
      newPassword.value.length >= MIN_PASSWORD_LENGTH &&
      newPassword.value === confirmPassword.value,
  );

  /** 入力中のパスワードをすべて破棄する */
  function clearFields() {
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  }

  /** 編集モードを開始し、全フィールドを空にする */
  function startEdit() {
    clearFields();
    isEditing.value = true;
  }

  /** 編集をキャンセルして編集モードを終了する（入力中のパスワードは破棄する） */
  function cancelEdit() {
    clearFields();
    isEditing.value = false;
  }

  /**
   * パスワードを変更する。失敗時は isEditing を維持したまま toast.error を表示する。
   * loading 中の重複呼び出しは無視する。
   */
  async function submitEdit() {
    if (loading.value) return;
    if (!canSubmit.value) return;
    loading.value = true;

    try {
      const { error } = await changePassword({
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
        // パスワード変更後は他デバイスのセッションを失効させ、
        // 変更前のパスワードで居座られないようにする
        revokeOtherSessions: true,
      });
      if (error) {
        toast.error(error.message ?? 'パスワードの変更に失敗しました');
        return;
      }
      toast.success('パスワードを変更しました');
      clearFields();
      isEditing.value = false;
    } catch {
      toast.error('パスワードの変更に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return {
    isEditing,
    canSubmit,
    loading,
    currentPassword,
    newPassword,
    confirmPassword,
    startEdit,
    cancelEdit,
    submitEdit,
  };
};
