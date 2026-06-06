<script setup lang="ts">
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import InputBasicInfo from '@/features/GameSession/InputBasicInfo.vue';
import InputScheduleInfo from '@/features/GameSession/InputScheduleInfo.vue';
</script>

<template>
  <div class="container">
    <BaseSectionHeading level="h1" text-color="primary">セッション新規作成</BaseSectionHeading >
    <InputBasicInfo></InputBasicInfo>
    <InputScheduleInfo></InputScheduleInfo>
  </div>
</template>

<style>

.container {
  >* {
    margin: var(--space-5)
  }
}
</style>
