<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
</script>

<template>
  <div class="app-container">
    <AppHeader class="header" />
    <div class="content">
      <router-view />
    </div>
    <AppFooter class="footer" />
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text);
  display: flex;
  flex-direction: column;
}

.header {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  padding: var(--space-4);
}

.content {
  flex: 1;
  padding: var(--space-4);
}

.footer {
  bottom: 0;
  width: 100%;
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  text-align: center;
  padding: var(--space-2);
}
</style>
