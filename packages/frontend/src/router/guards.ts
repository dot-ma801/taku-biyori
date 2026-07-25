import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    /** true のルートは未ログインでは開けず、/login へリダイレクトする */
    requiresAuth?: boolean;
  }
}

/**
 * 認証が必要なルートへ未ログインで入ろうとしたときの遷移先を返す。
 * ログイン後に元のページへ戻れるよう、ルート名を next-page クエリに引き継ぐ。
 * リダイレクトが不要な場合は null を返す。
 */
export const resolveAuthRedirect = (
  to: RouteLocationNormalized,
  isAuthenticated: boolean,
): RouteLocationRaw | null => {
  if (!to.meta.requiresAuth || isAuthenticated) return null;

  return {
    name: 'login',
    query: typeof to.name === 'string' ? { 'next-page': to.name } : {},
  };
};
