<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import BaseToastContainer from '@/components/common/BaseToastContainer/BaseToastContainer.vue';
</script>

<template>
  <div class="app-container">
    <AppHeader class="header" />
    <div class="content">
      <router-view />
    </div>
    <AppFooter class="footer" />
    <BaseToastContainer />
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text);
  display: flex;
  flex-direction: column;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  padding: var(--space-4);
}

.content {
  flex: 1;
  padding: var(--space-4);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.footer {
  position: sticky;
  bottom: 0;
  z-index: 100;
  width: 100%;
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  text-align: center;
  padding: var(--space-2);
}
</style>
