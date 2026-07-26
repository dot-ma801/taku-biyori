<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router';
import BaseTabs, {
  type TabItem,
} from '@/components/common/BaseTabs/BaseTabs.vue';
import LoginCard from '@/features/user/LoginCard.vue';
import SignupCard from '@/features/user/SignupCard.vue';
import { useAuthStore } from '@/stores/auth';

const LOGIN_TABS = [
  { value: 'signin', label: 'ログイン' },
  { value: 'signup', label: '新規作成' },
] satisfies TabItem[];

type LoginTabValue = (typeof LOGIN_TABS)[number]['value'];

const parseLoginTab = (
  raw: LocationQueryValue | LocationQueryValue[] | undefined,
): LoginTabValue => (raw === 'signin' || raw === 'signup' ? raw : 'signin');

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const activeTab = computed(() => parseLoginTab(route.query.tab));
const nestPage = computed(() => {
  const p = route.query['next-page'];
  return typeof p === 'string' ? p : null;
});

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await authStore.initSession();
  }
  if (authStore.isAuthenticated) {
    await router.push({ name: nestPage.value ?? 'dashboard' });
  }
});
</script>

<template>
  <div class="container">
    <BaseTabs v-model="activeTab" :tabs="LOGIN_TABS" stretch fixed-height>
      <!-- ログインタブ -->
      <template #signin>
        <LoginCard class="card" :nest-page="nestPage"></LoginCard>
      </template>

      <!-- 新規作成タブ -->
      <template #signup>
        <SignupCard class="card" :nest-page="nestPage" />
      </template>
    </BaseTabs>
  </div>
</template>

<style scoped>
.container {
  height: 100%;
  padding: 0 var(--space-7);
  align-items: center;

  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card {
  width: 400px;
  margin-bottom: 100px;
}
</style>
