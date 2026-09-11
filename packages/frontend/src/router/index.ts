import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import AfterLogin from '@/views/AfterLogin.vue';
import { resolveAuthRedirect } from '@/router/guards';
import { PAGE_NAME } from '@/config/pageName';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: PAGE_NAME.top,
      component: () => import('@/views/TopView.vue'),
    },
    {
      path: '/login',
      name: PAGE_NAME.login,
      component: LoginView,
    },
    {
      path: '/auth/callback',
      name: PAGE_NAME.authCallback,
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
      name: PAGE_NAME.dashboard,
      component: () => import('@/views/Dashboard/DashboardView.vue'),
    },
    // 卓の一覧。データ側は Lobby / GameSession のままだが、この画面は
    // UI 表示層で1つの「卓」に畳んで見せる（#147 / #151）。
    {
      path: '/game-sessions',
      name: PAGE_NAME.gameSessions,
      component: () => import('@/views/GameSession/ListView.vue'),
    },
    // 旧 URL。404 ルートが無く未定義パスは白画面になるため残す
    { path: '/lobbies', redirect: { name: PAGE_NAME.gameSessions } },
    // 開催はロビーに属するため、画面ルートも API と同じくロビー配下へ入れ子にする
    // （design-v2 §7-1）。**旧パスからのリダイレクトは作らない。**
    {
      path: '/lobbies/:lobbyId/game-sessions/:gameSessionId/edit',
      name: PAGE_NAME.gameSessionsEdit,
      component: () => import('@/views/GameSession/EditView.vue'),
      props: (to) => ({
        lobbyId: to.params.lobbyId,
        gameSessionId: to.params.gameSessionId,
      }),
    },
    // 開催の詳細ページは卓詳細に統合された（#152）。URL は design-v2 §7-1 の
    // 入れ子のまま残し、同じ卓詳細を「メンバー」タブで開く
    {
      path: '/lobbies/:lobbyId/game-sessions/:gameSessionId',
      name: PAGE_NAME.gameSessionsDetail,
      component: () => import('@/views/GameSession/DetailView.vue'),
      // URL が名指しした開催をそのまま渡す。渡さないと代表に選ばれた別の開催が
      // 開いてしまい、ブックマークや編集後の戻り先がすり替わる
      props: (to) => ({
        lobbyId: to.params.lobbyId,
        gameSessionId: to.params.gameSessionId,
        initialTab: 'members',
      }),
    },
    // プレイ中に何度も開き直すため、開催の詳細を経由せず直接開ける URL を持たせる。
    // 完了・中止した開催の公開メモは未ログイン・ゲストにも開く（要求 §3-4）ため
    // requiresAuth は付けない。書く操作の可否は画面側の着席判定が決める。
    {
      path: '/lobbies/:lobbyId/game-sessions/:gameSessionId/play-memo',
      name: PAGE_NAME.gameSessionsPlayMemo,
      component: () => import('@/views/GameSession/PlayMemoView.vue'),
      props: (to) => ({
        lobbyId: to.params.lobbyId,
        gameSessionId: to.params.gameSessionId,
      }),
    },
    {
      path: '/profile/setting',
      name: PAGE_NAME.profileSetting,
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      // 「日程が決まっている」モードはロビーと開催の両方を作るため、
      // 旧 /game-sessions/new と同じく認証が要る（design-v2 §7-1 で統合した）
      path: '/lobbies/new',
      name: PAGE_NAME.lobbiesNew,
      component: () => import('@/views/Lobby/CreateView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/lobbies/:lobbyId/edit',
      name: PAGE_NAME.lobbiesEdit,
      component: () => import('@/views/Lobby/EditView.vue'),
      props: (to) => ({
        lobbyId: to.params.lobbyId,
      }),
    },
    // 卓詳細。ロビー詳細と開催詳細を1画面に統合した（#152）
    {
      path: '/lobbies/:lobbyId',
      name: PAGE_NAME.lobbiesDetail,
      component: () => import('@/views/GameSession/DetailView.vue'),
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
