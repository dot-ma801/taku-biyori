import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

type AuthCall = () => Promise<{
  data: unknown;
  error: { message?: string } | null;
}>;

export function useAuthForm() {
  const router = useRouter();
  const authStore = useAuthStore();

  const loading = ref<boolean>(false);
  const errorMessage = ref<string>('');

  const submit = async (authCall: AuthCall) => {
    loading.value = true;
    errorMessage.value = '';
    try {
      const { data, error } = await authCall();
      if (error) {
        errorMessage.value = error.message ?? 'エラーが発生しました';
        return;
      }
      if (data) {
        await authStore.initSession();
        // FIXME:
        router.push({ name: 'auth-callback' });
      }
    } catch {
      errorMessage.value = 'エラーが発生しました';
    } finally {
      loading.value = false;
    }
  };

  return { loading, errorMessage, submit };
}
