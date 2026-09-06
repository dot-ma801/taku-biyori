<script setup lang="ts">
import { Sun, Moon } from '@lucide/vue';
import { useThemeStore } from '@/stores/theme';
import { computed, watchEffect } from 'vue';

const themeStore = useThemeStore();

const toggleTheme = () => {
  themeStore.toggleDark();
};

const label = computed(() =>
  themeStore.isDark ? 'ライトテーマに切り替え' : 'ダークテーマに切り替え',
);

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', themeStore.currentTheme);
  localStorage.setItem('theme', themeStore.currentTheme);
});
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="label"
    :title="label"
    @click="toggleTheme"
  >
    <Sun v-if="themeStore.isDark" :size="18" aria-hidden="true" />
    <Moon v-else :size="18" aria-hidden="true" />
  </button>
</template>

<style scoped>
/* DS IconButton（ghost / sm）と同じ寸法・状態表現 */
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: var(--border-width) solid transparent;
  border-radius: var(--radius-control);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-control);
}
.theme-toggle:hover {
  background: var(--surface-subtle);
  color: var(--text-primary);
}
.theme-toggle:active {
  background: var(--border-subtle);
}
.theme-toggle:focus-visible {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: var(--focus-ring);
}
</style>
