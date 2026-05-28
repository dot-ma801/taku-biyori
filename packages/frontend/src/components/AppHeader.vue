<script setup lang="ts">
import ThemeSwitchButton from './ui/button/ThemeSwitchButton.vue';
</script>

<template>
  <header>
    <h1>AppName</h1>
    <ThemeSwitchButton />
  </header>
</template>

<style scoped>
header {
  background-color: var(--color-primary);
  padding: var(--space-4);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

h1 {
  font-size: 1.5rem;
  color: var(--color-on-primary);
  margin: 0;
  pointer-events: none;
}
</style>
