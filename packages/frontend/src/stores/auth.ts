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
  /** 一度でもセッション取得を完了したか */
  const initialized = ref(false);

  // 実行中のセッション取得。同時に呼ばれた initSession() を 1 本の通信にまとめる
  let inFlight: Promise<void> | null = null;

  /** ログイン済みかどうか */
  const isAuthenticated = computed(() => !!user.value);
  /** 現在のログインユーザー */
  const currentUser = computed(() => user.value);

  const fetchSession = async () => {
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
      initialized.value = true;
    }
  };

  /**
   * セッションを取得し直してユーザー情報を更新する。
   * 取得中に呼ばれた場合は同じ通信を共有し、多重リクエストを防ぐ。
   */
  const initSession = (): Promise<void> => {
    inFlight ??= fetchSession().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };

  /**
   * 初回のセッション復元が終わるまで待つ。
   * すでに終わっていれば通信せず即座に解決する。
   * 認証状態に依存する処理（ルートガードなど）はこちらを使うこと。
   */
  const ensureSessionReady = (): Promise<void> => {
    if (initialized.value) {
      return Promise.resolve();
    }
    return initSession();
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
    initialized,
    isAuthenticated,
    currentUser,
    initSession,
    ensureSessionReady,
    logout,
    clearSession,
  };
});
