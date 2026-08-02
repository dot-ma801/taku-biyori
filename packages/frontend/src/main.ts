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

// セッション取得はバックエンドへの通信を伴うため、await すると
// その分だけ mount が遅れて画面が真っ白なままになる。
// ここでは投げるだけにして、待ちが必要なルートは router のガードに任せる。
useAuthStore().initSession();

app.mount('#app');
