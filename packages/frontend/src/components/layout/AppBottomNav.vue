<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useGlobalNavItems } from '@/components/layout/GlobalNav/useGlobalNavItems';

const route = useRoute();

// route.name は Symbol も取りうるので、判定に使う文字列だけを渡す
const currentRouteName = computed(() =>
  typeof route.name === 'string' ? route.name : null,
);

const { items } = useGlobalNavItems(currentRouteName);
</script>

<template>
  <nav class="bottom-nav" aria-label="メインメニュー">
    <RouterLink
      v-for="item in items"
      :key="item.id"
      :to="item.to"
      class="bottom-nav__item"
      :class="{ 'bottom-nav__item--current': item.isCurrent }"
      :aria-current="item.ariaCurrent"
    >
      <component :is="item.icon" :size="19" aria-hidden="true" />
      {{ item.label }}
    </RouterLink>
  </nav>
</template>

<style scoped>
/* モバイル専用の下部タブバー（v0.4.dc.html のモバイルシェル）。
   sticky なので流れの中に場所を確保したまま画面下に貼り付く。 */
.bottom-nav {
  position: sticky;
  bottom: 0;
  z-index: 100;
  display: flex;
  background: var(--surface);
  border-top: var(--border-width) solid var(--border-subtle);
  /* ホームインジケータのある端末で最下段のラベルが隠れないようにする */
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-nav__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 60px;
  font: var(--text-caption);
  color: var(--text-tertiary);
  text-decoration: none;
  transition: var(--transition-control);
}
.bottom-nav__item:hover {
  color: var(--text-secondary);
}
.bottom-nav__item:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
.bottom-nav__item--current,
.bottom-nav__item--current:hover {
  color: var(--primary);
}

/* デスクトップはヘッダー内のナビが担当する */
@media (min-width: 769px) {
  .bottom-nav {
    display: none;
  }
}
</style>
