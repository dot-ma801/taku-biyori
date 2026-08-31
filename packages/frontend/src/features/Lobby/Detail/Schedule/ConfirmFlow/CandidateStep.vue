<script setup lang="ts">
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';
import { formatDateWithWeekday } from '@/utils/date';

defineProps<{
  candidateOptions: {
    id: string;
    date: string;
    timeLabel: string | null;
    counts: { ok: number; maybe: number; ng: number };
  }[];
  selectedCandidateId: string | null;
  scheduledAt: string;
  loading: boolean;
}>();

const emit = defineEmits<{
  select: [id: string];
  'update:scheduled-at': [date: string];
}>();

function handleScheduledAtUpdate(value: string | string[] | undefined) {
  if (value === undefined) {
    emit('update:scheduled-at', '');
    return;
  }
  emit('update:scheduled-at', Array.isArray(value) ? (value[0] ?? '') : value);
}
</script>

<template>
  <p class="step-label">候補日から選ぶか、開催日を直接指定してください</p>
  <BaseDatePicker
    :model-value="scheduledAt"
    label="開催日"
    disable-past
    required
    @update:model-value="handleScheduledAtUpdate"
  />
  <p v-if="loading" class="loading">候補日を読み込んでいます…</p>
  <ul v-else-if="candidateOptions.length > 0" class="candidate-list">
    <li v-for="option in candidateOptions" :key="option.id">
      <button
        type="button"
        :class="[
          'candidate-item',
          { 'candidate-item--selected': selectedCandidateId === option.id },
        ]"
        @click="emit('select', option.id)"
      >
        <span class="candidate-main">
          <span class="candidate-date">{{
            formatDateWithWeekday(option.date)
          }}</span>
          <span v-if="option.timeLabel" class="candidate-note">{{
            option.timeLabel
          }}</span>
        </span>
        <span class="candidate-counts">
          <span class="ok">○ {{ option.counts.ok }}</span>
          <span class="maybe">△ {{ option.counts.maybe }}</span>
          <span class="ng">× {{ option.counts.ng }}</span>
        </span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.step-label,
.loading {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0 0 var(--space-3);
}
.candidate-list {
  list-style: none;
  margin: var(--space-4) 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.candidate-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  text-align: left;
  font: inherit;
}
.candidate-item:hover,
.candidate-item--selected {
  border-color: var(--color-primary);
  background: var(--color-surface-raised);
}
.candidate-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.candidate-date {
  font-weight: 500;
}
.candidate-note {
  font-size: 12px;
  color: var(--color-text-secondary);
}
.candidate-counts {
  display: flex;
  gap: var(--space-3);
  font-size: 13px;
}
.ok {
  color: var(--color-success, #2da44e);
}
.maybe {
  color: var(--color-warning, #bf8700);
}
.ng {
  color: var(--color-error, #cf222e);
}
</style>
