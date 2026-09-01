<script setup lang="ts">
import { formatDateWithWeekday } from '@/utils/date';

defineProps<{
  candidateOptions: {
    id: string;
    date: string;
    timeLabel: string | null;
    counts: { ok: number; maybe: number; ng: number };
  }[];
  selectedCandidateId: string | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  select: [id: string];
}>();
</script>

<template>
  <p class="step-label">日程調整の候補日から開催日を選んでください</p>
  <p v-if="loading" class="empty">候補日を読み込んでいます…</p>
  <p v-else-if="candidateOptions.length === 0" class="empty">
    候補日がありません。先に日程調整で候補日を追加してください
  </p>
  <ul v-else class="candidate-list">
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
.empty {
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
