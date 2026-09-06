<script setup lang="ts">
import { computed } from 'vue';
import { Construction } from '@lucide/vue';
import { useRoute } from 'vue-router';
import ThemeSwitchButton from '@/components/layout/ThemeSwitchButton.vue';
import LoginButton from '@/features/user/LoginButton.vue';
import { useGlobalNavItems } from '@/components/layout/GlobalNav/useGlobalNavItems';

const route = useRoute();

// route.name は Symbol も取りうるので、判定に使う文字列だけを渡す
const currentRouteName = computed(() =>
  typeof route.name === 'string' ? route.name : null,
);

const { items } = useGlobalNavItems(currentRouteName);
</script>

<template>
  <header class="global-nav">
    <RouterLink :to="{ name: 'dashboard' }" class="global-nav__logo">
      <Construction class="global-nav__logo-mark" :size="22" />
      <span class="global-nav__logo-text">たく日和</span>
    </RouterLink>

    <nav class="global-nav__nav" aria-label="メインメニュー">
      <RouterLink
        v-for="item in items"
        :key="item.id"
        :to="item.to"
        class="global-nav__item"
        :class="{ 'global-nav__item--current': item.isCurrent }"
        :aria-current="item.ariaCurrent"
      >
        <component :is="item.icon" :size="17" aria-hidden="true" />
        {{ item.label }}
      </RouterLink>
    </nav>

    <div class="global-nav__actions">
      <ThemeSwitchButton />
      <LoginButton />
    </div>
  </header>
</template>

<style scoped>
/* DS GlobalNav: --nav-height の --surface バー。ヘッダーは chrome なので
   背景色を持たず、境界は --border-subtle の1本だけで表す。 */
.global-nav {
  height: var(--nav-height);
  display: flex;
  align-items: center;
  gap: var(--space-6);
  padding: 0 var(--space-6);
  background: var(--surface);
  color: var(--text-primary);
  border-bottom: var(--border-width) solid var(--border-subtle);
}

.global-nav__logo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-primary);
  text-decoration: none;
  border-radius: var(--radius-sm);
}
.global-nav__logo:hover {
  color: var(--text-primary);
}
.global-nav__logo:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.global-nav__logo-mark {
  color: var(--primary);
  flex-shrink: 0;
}

.global-nav__logo-text {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: var(--weight-bold);
  white-space: nowrap;
}

.global-nav__nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex: 1;
}

.global-nav__item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 36px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  font: var(--text-body-sm);
  color: var(--text-secondary);
  text-decoration: none;
  white-space: nowrap;
  transition: var(--transition-control);
}
.global-nav__item:hover {
  background: var(--surface-subtle);
  color: var(--text-primary);
}
.global-nav__item:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
.global-nav__item--current {
  font-weight: var(--weight-semibold);
  background: var(--primary-subtle);
  color: var(--primary-on-subtle);
}
.global-nav__item--current:hover {
  background: var(--primary-subtle);
  color: var(--primary-on-subtle);
}

.global-nav__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

/* モバイルではナビを下部タブバー（AppBottomNav）へ逃がす */
@media (max-width: 768px) {
  .global-nav {
    height: 56px;
    gap: var(--space-3);
    padding: 0 var(--space-4);
  }
  .global-nav__nav {
    display: none;
  }
  .global-nav__logo-text {
    font-size: 17px;
  }
}
</style>
