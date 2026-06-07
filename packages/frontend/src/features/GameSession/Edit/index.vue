<script setup lang="ts">
defineOptions({ name: 'GameSessionEdit' });
import BaseButton from '@/components/button/BaseButton.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import InputBasicInfo from '@/features/GameSession/Edit/InputBasicInfo.vue';
import InputMemo from '@/features/GameSession/Edit/InputMemo.vue';
import InputScheduleInfo from '@/features/GameSession/Edit/InputScheduleInfo.vue';

const props = defineProps<{
  heading: string;
  submitLabel: string;
  loading: boolean;
  errorMessage: string;
}>();

const emit = defineEmits<{
  submit: [];
  cancel: [];
}>();

const title = defineModel<string>('title', { default: '' });
const scenarioName = defineModel<string>('scenarioName', { default: '' });
const maxMembers = defineModel<string>('maxMembers', { default: '' });
const description = defineModel<string>('description', { default: '' });
const openUntil = defineModel<string>('openUntil', { default: '' });
</script>

<template>
  <div class="container">
    <BaseSectionHeading level="h1" text-color="primary">
      {{ heading }}
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
      @click="emit('cancel')"
    >
      キャンセル
    </BaseButton>
    <BaseButton size="lg" :disabled="loading || !title" @click="emit('submit')">
      {{ loading ? '処理中…' : submitLabel }}
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
