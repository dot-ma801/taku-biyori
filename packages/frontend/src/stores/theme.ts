import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false); // Default to light theme

  // Check user's system preference for dark mode
  if (typeof window !== 'undefined' && window.matchMedia) {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  const toggleDark = () => {
    isDark.value = !isDark.value;
  };

  const currentTheme = computed(() => (isDark.value ? 'dark' : 'light'));

  return { isDark, toggleDark, currentTheme };
});
