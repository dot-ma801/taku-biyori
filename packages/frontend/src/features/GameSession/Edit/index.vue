<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import InputBasicInfo from '@/features/GameSession/Edit/InputBasicInfo.vue';
import InputMemo from '@/features/GameSession/Edit/InputMemo.vue';
import InputScheduleInfo from '@/features/GameSession/Edit/InputScheduleInfo.vue';
import { useCreateGameSession } from '@/features/GameSession/Edit/useCreateGameSession';

const {
  title,
  scenarioName,
  maxMembers,
  description,
  openUntil,
  loading,
  errorMessage,
  submit,
  cancel,
} = useCreateGameSession();
</script>

<template>
  <div class="container">
    <BaseSectionHeading level="h1" text-color="primary">
      セッション新規作成
    </BaseSectionHeading>

    <InputBasicInfo
      v-model:title="title"
      v-model:scenarioName="scenarioName"
      v-model:maxMembers="maxMembers"
    ></InputBasicInfo>
    <InputScheduleInfo v-model:openUntil="openUntil"></InputScheduleInfo>
    <InputMemo v-model:description="description"></InputMemo>
  </div>

  <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

  <div class="button-area">
    <BaseButton
      size="lg"
      variant="secondary"
      :disabled="loading"
      @click="cancel"
    >
      キャンセル
    </BaseButton>
    <BaseButton size="lg" :disabled="loading || !title" @click="submit">
      {{ loading ? '作成中…' : 'セッションを作成する' }}
    </BaseButton>
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
