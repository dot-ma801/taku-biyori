import { ref, onMounted } from 'vue';
import { listAccounts } from '@/lib/auth';

/**
 * ログイン中ユーザーが credential（userid + password）アカウントを
 * 持っているかどうかを取得する。Google 連携のみのユーザーは
 * パスワードを持たないため、パスワード変更UIの出し分けに使う。
 */
export const useAccounts = () => {
  const hasPassword = ref(false);
  const loading = ref(false);

  async function fetch() {
    loading.value = true;

    try {
      const { data } = await listAccounts();
      hasPassword.value =
        data?.some((account) => account.providerId === 'credential') ?? false;
    } catch {
      hasPassword.value = false;
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetch);

  return {
    hasPassword,
    loading,
    fetch,
  };
};
