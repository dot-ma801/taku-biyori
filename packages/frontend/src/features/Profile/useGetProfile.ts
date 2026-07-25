import { ref, onMounted } from 'vue';
import { getProfile } from '@/api/profile';
import { ApiError } from '@/lib/api-client';
import type { ProfileResponse } from '@taku-biyori/shared';

export const useGetProfile = () => {
  const profile = ref<ProfileResponse | null>(null);
  // 初回マウント直後（fetch 開始前）の1フレームで空白がフラッシュしないよう true で始める
  const loading = ref(true);
  const errorMessage = ref('');

  async function fetch() {
    loading.value = true;
    errorMessage.value = '';

    try {
      profile.value = await getProfile();
    } catch (err) {
      if (err instanceof ApiError) {
        errorMessage.value = err.message;
      } else {
        errorMessage.value = 'エラーが発生しました';
      }
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetch);

  function patchProfile(patch: Partial<ProfileResponse>) {
    if (profile.value) {
      profile.value = { ...profile.value, ...patch };
    }
  }

  return {
    profile,
    loading,
    errorMessage,
    fetch,
    patchProfile,
  };
};
