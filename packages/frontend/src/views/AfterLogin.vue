<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { useLoading } from '@/composables/useLoading';
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';

const props = defineProps<{
  nextPage?: string | null;
}>();

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const { withLoading } = useLoading();

onMounted(() =>
  withLoading(async () => {
    await authStore.initSession();
    if (authStore.isAuthenticated) {
      await router.push({ name: props.nextPage ?? 'dashboard' });
    } else {
      toast.error('ログインに失敗しました。もう一度お試しください。');
      await router.push({ name: 'login' });
    }
  }, 'ログイン中…'),
);
</script>

<template>
  <!-- ローディング表示は App.vue の BaseLoadingOverlay が担当する -->
  <div class="container" />
</template>

<style scoped>
.container {
  flex: 1;
  height: 100%;
}
</style>
