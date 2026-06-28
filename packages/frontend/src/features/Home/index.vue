<script setup lang="ts">
defineOptions({ name: 'Home' });
import MySessionList from '@/features/Home/MySessionList.vue';
import PublicSessionList from '@/features/Home/PublicSessionList.vue';
</script>

<template>
  <div class="container">
    <MySessionList></MySessionList>
    <PublicSessionList></PublicSessionList>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
