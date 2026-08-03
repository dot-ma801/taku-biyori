import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import AfterLogin from '@/views/AfterLogin.vue';
import { resolveAuthRedirect } from '@/router/guards';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'top',
      component: () => import('@/views/TopView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: AfterLogin,
      props: (to) => ({
        nextPage:
          typeof to.query['next-page'] === 'string'
            ? to.query['next-page']
            : null,
      }),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/Dashboard/DashboardView.vue'),
    },
    // 卓・ロビーの一覧ページはダッシュボードに統合した。
    // 404 ルートが無く未定義パスは白画面になるため、旧 URL は残してリダイレクトする。
    { path: '/game-sessions', redirect: { name: 'dashboard' } },
    { path: '/lobbies', redirect: { name: 'dashboard' } },
    {
      path: '/game-sessions/new',
      name: 'game-sessions-new',
      component: () => import('@/views/GameSession/CreateView.vue'),
    },
    {
      path: '/game-sessions/edit/:gameSessionId',
      name: 'game-sessions-edit',
      component: () => import('@/views/GameSession/EditView.vue'),
      props: (to) => ({
        gameSessionId: to.params.gameSessionId,
      }),
    },
    {
      path: '/game-sessions/:gameSessionId',
      name: 'game-sessions-detail',
      component: () => import('@/views/GameSession/DetailView.vue'),
      props: (to) => ({
        gameSessionId: to.params.gameSessionId,
      }),
    },
    // プレイ中に何度も開き直すため、卓詳細を経由せず直接開ける URL を持たせる。
    // メモは本質的にログインユーザー限定なので requiresAuth を付け、
    // 未ログインの直アクセスはガードでログインへ流す（画面側に導線を持たせない）。
    {
      path: '/game-sessions/:gameSessionId/play-memo',
      name: 'game-sessions-play-memo',
      component: () => import('@/views/GameSession/PlayMemoView.vue'),
      props: (to) => ({
        gameSessionId: to.params.gameSessionId,
      }),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile/setting',
      name: 'profile-setting',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/lobbies/new',
      name: 'lobbies-new',
      component: () => import('@/views/Lobby/CreateView.vue'),
    },
    {
      path: '/lobbies/edit/:lobbyId',
      name: 'lobbies-edit',
      component: () => import('@/views/Lobby/EditView.vue'),
      props: (to) => ({
        lobbyId: to.params.lobbyId,
      }),
    },
    {
      path: '/lobbies/:lobbyId',
      name: 'lobbies-detail',
      component: () => import('@/views/Lobby/DetailView.vue'),
      props: (to) => ({
        lobbyId: to.params.lobbyId,
      }),
    },
  ],
  // ページ遷移では先頭に戻し、ブラウザバック時は元の位置に復元する
  scrollBehavior: (_to, _from, savedPosition) => savedPosition ?? { top: 0 },
});

// セッション復元は mount をブロックしないため、初回ナビゲーション時点では
// まだ完了していないことがある。認証状態で判定が変わる requiresAuth のルートだけ
// 復元の完了を待ち、それ以外は待たずに描画して初回表示を速く保つ。
router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth) {
    await authStore.ensureSessionReady();
  }
  return resolveAuthRedirect(to, authStore.isAuthenticated) ?? true;
});

export default router;
