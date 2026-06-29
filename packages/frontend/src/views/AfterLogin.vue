<script setup lang="ts">
import BaseProgress from '@/components/common/BaseProgress/BaseProgress.vue';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

onMounted(async () => {
  await authStore.initSession();
  if (authStore.isAuthenticated) {
    router.push({ name: 'game-sessions-list' });
  } else {
    toast.error('ログインに失敗しました。もう一度お試しください。');
    router.push({ name: 'login' });
  }
});
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
  </div>
</template>

<style scoped>
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
