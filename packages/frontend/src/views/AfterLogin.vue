<script setup lang="ts">
import BaseProgress from '@/components/common/BaseProgress/BaseProgress.vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();
authStore.initSession();

// TODO: 実装する
if (authStore.isAuthenticated) {
  // ログイン成功
  // router.push()
} else {
  // ログイン失敗
  // router.push()
}

const logout = () => {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="container">
    <BaseProgress
      class="progress"
      :value="60"
      :max="100"
      indeterminate
      label="ログイン中…"
    />

    <!-- FIXME: 要削除 -->
    <div>
      <p>{{ authStore.user?.email }}</p>
      <button @click="logout">ログアウト</button>
    </div>
  </div>
</template>

<style>
.container {
  flex: 1;
  height: 100%;
  position: relative;
}

.progress {
  width: 300px;
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
