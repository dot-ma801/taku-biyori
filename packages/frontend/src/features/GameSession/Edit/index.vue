<script setup lang="ts">
defineOptions({ name: 'GameSessionEdit' });
import { computed } from 'vue';
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
  /**
   * ロビーの既定値。上書き欄のプレースホルダに出し、
   * 「空欄のままならこの値が表示される」ことを伝える（design-v2 §5-5）
   */
  lobbyDefaults?: {
    title: string;
    scenarioName: string | null;
    location: string | null;
  } | null;
}>();

const submitButtonLabel = computed(() =>
  props.loading ? '処理中…' : props.submitLabel,
);

const emit = defineEmits<{
  submit: [];
  cancel: [];
}>();

const title = defineModel<string>('title', { default: '' });
const scenarioName = defineModel<string>('scenarioName', { default: '' });
const timeLabel = defineModel<string>('timeLabel', { default: '' });
const description = defineModel<string>('description', { default: '' });
const scheduledAt = defineModel<string>('scheduledAt', { default: '' });
const location = defineModel<string>('location', { default: '' });

/** 卓はタイトルと開催日が確定していないと作れない（design-v1.1 §8） */
const canSubmit = computed(
  () => !props.loading && !!title.value && !!scheduledAt.value,
);
</script>

<template>
  <div class="container">
    <BaseSectionHeading level="h1">
      {{ heading }}
    </BaseSectionHeading>

    <InputBasicInfo
      v-model:title="title"
      v-model:scenarioName="scenarioName"
      :lobby-defaults="props.lobbyDefaults"
    ></InputBasicInfo>
    <InputScheduleInfo
      v-model:scheduledAt="scheduledAt"
      v-model:location="location"
      v-model:timeLabel="timeLabel"
      :lobby-location="props.lobbyDefaults?.location ?? null"
    ></InputScheduleInfo>
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
    <BaseButton size="lg" :disabled="!canSubmit" @click="emit('submit')">
      {{ submitButtonLabel }}
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
