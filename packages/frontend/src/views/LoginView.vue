<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Construction } from '@lucide/vue';
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
    <RouterLink
      :to="{ name: 'top' }"
      class="brand"
      aria-label="たく日和のトップへ"
    >
      <Construction class="brand__mark" :size="30" aria-hidden="true" />
      <span class="brand__text">たく日和</span>
    </RouterLink>

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
  min-height: 100%;
  padding: var(--space-12) var(--gutter);
  gap: var(--space-8);

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-primary);
  text-decoration: none;
  border-radius: var(--radius-sm);
}
.brand:hover {
  color: var(--text-primary);
}
.brand:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.brand__mark {
  color: var(--primary);
}

.brand__text {
  font-family: var(--font-display);
  font-size: var(--size-h2);
  font-weight: var(--weight-bold);
}

.card {
  width: min(400px, 100%);
}
</style>
