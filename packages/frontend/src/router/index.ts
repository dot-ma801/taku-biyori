import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import AfterLogin from '@/views/AfterLogin.vue';

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
    },
    {
      path: '/game-sessions',
      name: 'game-sessions-list',
      component: () => import('@/views/GameSession/ListView.vue'),
    },
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
  ],
});

export default router;
