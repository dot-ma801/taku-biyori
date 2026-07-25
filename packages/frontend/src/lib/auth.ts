import { createAuthClient } from 'better-auth/client';
import { usernameClient } from 'better-auth/client/plugins';

/**
 * Better Auth クライアント
 * フロントエンドから認証 API にアクセスするためのクライアント
 */

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const authClient = createAuthClient({
  baseURL: apiUrl,
  plugins: [usernameClient()],
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
  listAccounts,
} = authClient;
