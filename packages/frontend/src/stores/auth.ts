import { SessionResponseSchema, type User } from '@taku-biyori/shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authClient } from '@/lib/auth.js';

/**
 * 認証状態を管理するストアです。
 * 共有スキーマを使って Better Auth のレスポンスを安全に読み取ります。
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /** ログイン済みかどうか */
  const isAuthenticated = computed(() => !!user.value);
  /** 現在のログインユーザー */
  const currentUser = computed(() => user.value);

  /** アプリ起動時にセッションを取得し、ユーザー情報を初期化する */
  const initSession = async () => {
    loading.value = true;
    try {
      const response = await authClient.getSession();
      const sessionResult = SessionResponseSchema.safeParse(
        response && typeof response === 'object' && 'data' in response
          ? response.data
          : response,
      );

      if (sessionResult.success) {
        user.value = sessionResult.data.user;
        error.value = null;
      } else {
        user.value = null;
        error.value = sessionResult.error.message;
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to load session';
    } finally {
      loading.value = false;
    }
  };

  /** サインアウトしてユーザー情報をクリアする */
  const logout = async () => {
    try {
      await authClient.signOut();
      user.value = null;
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to logout';
    }
  };

  /** API を呼ばずにローカルのセッション状態だけをリセットする */
  const clearSession = () => {
    user.value = null;
    error.value = null;
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    currentUser,
    initSession,
    logout,
    clearSession,
  };
});
