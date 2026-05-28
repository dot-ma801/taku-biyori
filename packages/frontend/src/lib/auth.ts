import { createAuthClient } from 'better-auth/client';

/**
 * Better Auth クライアント
 * フロントエンドから認証 API にアクセスするためのクライアント
 */

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const authClient = createAuthClient({
  baseURL: apiUrl,
});

// 主要な認証メソッドをエクスポート
export const {
  signUp,
  signIn,
  signOut,
  useSession,
  getSession,
  updateUser,
  changePassword,
} = authClient;
