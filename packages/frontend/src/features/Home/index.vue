<script setup lang='ts'>
defineOptions({ name: 'Home' });
import MySessionList from '@/features/Home/MySessionList.vue';
import PublicSessionList from '@/features/Home/PublicSessionList.vue';
</script>

<template>
  <MySessionList></MySessionList>
  <PublicSessionList></PublicSessionList>
</template>

<style scoped></style>
