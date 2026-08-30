<script setup lang="ts">
defineOptions({ name: 'LobbyEdit' });
import InputBasicInfo from '@/features/Lobby/Edit/InputBasicInfo.vue';
import InputScheduleInfo from '@/features/Lobby/Edit/InputScheduleInfo.vue';
import BaseAlert from '@/components/common/BaseAlert/BaseAlert.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import type { PendingCandidateDate } from '@/utils/pendingCandidateDates';
import { computed } from 'vue';

const props = defineProps<{
  heading: string;
  submitLabel: string;
  loading: boolean;
  errorMessages: string[];
  hasSchedulePoll?: boolean;
}>();

const title = defineModel<string>('title', { default: '' });
const scenarioName = defineModel<string>('scenarioName', { default: '' });
const maxMembers = defineModel<string>('maxMembers', { default: '' });
const description = defineModel<string>('description', { default: '' });
const openUntil = defineModel<string>('openUntil', { default: '' });
const location = defineModel<string>('location', { default: '' });
const scheduledAt = defineModel<string>('scheduledAt', { default: '' });
const pendingDates = defineModel<PendingCandidateDate[]>('pendingDates', {
  default: () => [],
});

const emit = defineEmits<{
  submit: [];
  cancel: [];
}>();

const submitButtonLabel = computed(() =>
  props.loading ? '処理中…' : props.submitLabel,
);

const hasErrors = computed(() => props.errorMessages.length > 0);
</script>

<template>
  <div class="container">
    <BaseSectionHeading level="h1">
      {{ heading }}
    </BaseSectionHeading>
    <InputBasicInfo
      v-model:title="title"
      v-model:description="description"
      v-model:location="location"
      v-model:maxMembers="maxMembers"
      v-model:scenarioName="scenarioName"
    />
    <InputScheduleInfo
      v-model:openUntil="openUntil"
      v-model:scheduledAt="scheduledAt"
      v-model:pendingDates="pendingDates"
      :show-candidate-dates="props.hasSchedulePoll"
    />

    <div v-if="hasErrors" class="error-area">
      <BaseAlert
        v-for="message in errorMessages"
        :key="message"
        variant="error"
      >
        {{ message }}
      </BaseAlert>
    </div>

    <div class="button-area">
      <BaseButton
        size="lg"
        variant="secondary"
        :disabled="loading"
        @click="emit('cancel')"
      >
        キャンセル
      </BaseButton>
      <BaseButton
        size="lg"
        :disabled="loading || hasErrors"
        @click="emit('submit')"
      >
        {{ submitButtonLabel }}
      </BaseButton>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.error-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.button-area {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
</style>
