import { describe, it, expect, beforeEach } from 'vitest';

import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import App from '@/App.vue';

// シェル（ヘッダー・下部タブ）が現在地の判定に useRoute を使うため、
// マウントにはルーターが要る。画面の中身は router-view のスタブで置き換える。
const createTestRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/dashboard',
        name: 'dashboard',
        component: { template: '<div />' },
      },
      { path: '/tables', name: 'tables', component: { template: '<div />' } },
      {
        path: '/profile/setting',
        name: 'profile-setting',
        component: { template: '<div />' },
      },
    ],
  });

describe('App', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('mounts renders properly', async () => {
    const router = createTestRouter();
    await router.push({ name: 'dashboard' });
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          'router-view': true,
        },
      },
    });
    expect(wrapper.text()).toContain('たく日和');
  });
});
