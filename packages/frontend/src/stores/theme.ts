import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const getInitialDark = (): boolean => {
    if (typeof window === 'undefined') { return false; }
    const saved = localStorage.getItem('theme');
    if (saved !== null) { return saved === 'dark'; }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  };
  const isDark = ref(getInitialDark());

  const toggleDark = () => {
    isDark.value = !isDark.value;
  };

  const currentTheme = computed(() => (isDark.value ? 'dark' : 'light'));

  return { isDark, toggleDark, currentTheme };
});
