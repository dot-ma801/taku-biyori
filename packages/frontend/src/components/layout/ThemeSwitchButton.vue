<script setup lang="ts">
import { Sun, Moon } from '@lucide/vue';
import { useThemeStore } from '@/stores/theme';
import { watchEffect } from 'vue';

const themeStore = useThemeStore();

const toggleTheme = () => {
  themeStore.toggleDark();
};

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', themeStore.currentTheme);
  localStorage.setItem('theme', themeStore.currentTheme);
});
</script>

<template>
  <button class="theme-toggle" @click="toggleTheme">
    <Sun v-if="themeStore.isDark" :size="20" />
    <Moon v-else :size="20" />
  </button>
</template>

<style>
.theme-toggle {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  margin-left: auto;
  display: flex;
  align-items: center;
}
</style>
