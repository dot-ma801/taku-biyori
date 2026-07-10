<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import BaseToastContainer from '@/components/common/BaseToastContainer/BaseToastContainer.vue';
</script>

<template>
  <div class="app-container">
    <AppHeader class="app-container__header" />
    <div class="app-container__content">
      <router-view />
    </div>
    <AppFooter class="app-container__footer" />
    <BaseToastContainer />
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: var(--surface-app);
  color: var(--text-primary);
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.app-container__header {
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-container__content {
  min-height: 0;
}

.app-container__footer {
  position: relative;
  z-index: 1;
}
</style>
