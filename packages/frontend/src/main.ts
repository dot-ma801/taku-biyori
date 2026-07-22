import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from '@/App.vue';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';

import '@/style/main.css';

// フォントCSSは初回描画をブロックしないよう非同期で読み込む
import('@/style/fonts.css');

const app = createApp(App);

app.use(createPinia());
app.use(router);

const authStore = useAuthStore();
await authStore.initSession();

app.mount('#app');
