<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import InputBasicInfo from '@/features/GameSession/Edit/InputBasicInfo.vue';
import InputMemo from '@/features/GameSession/Edit/InputMemo.vue';
import InputScheduleInfo from '@/features/GameSession/Edit/InputScheduleInfo.vue';
</script>

<template>
  <div class="container">
    <BaseSectionHeading level="h1" text-color="primary">
      セッション新規作成
    </BaseSectionHeading>

    <InputBasicInfo></InputBasicInfo>
    <InputScheduleInfo></InputScheduleInfo>
    <InputMemo></InputMemo>
  </div>

  <div class="button-area">
    <BaseButton size="lg" variant="secondary">キャンセル</BaseButton>
    <BaseButton size="lg">セッションを作成する</BaseButton>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.button-area {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
</style>
