import { ref, onMounted } from 'vue';
import { listAccounts } from '@/lib/auth';

/**
 * ログイン中ユーザーが credential（userid + password）アカウントを
 * 持っているかどうかを取得する。Google 連携のみのユーザーは
 * パスワードを持たないため、パスワード変更UIの出し分けに使う。
 */
export const useAccounts = () => {
  const hasPassword = ref(false);
  // onMounted で必ず fetch するため、初期状態は「取得前（未確定）」として true から始める
  const loading = ref(true);

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
