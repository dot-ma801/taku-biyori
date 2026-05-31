import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import ComponentsView from '@/views/ComponentsView.vue';
import AfterLogin from '@/views/AfterLogin.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: AfterLogin,
    },
    {
      path: '/components',
      name: 'components',
      component: ComponentsView,
    },
  ],
});

export default router;
