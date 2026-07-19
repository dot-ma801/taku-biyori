<script setup lang="ts">
import { formatDateWithWeekday } from '@/utils/date';

defineProps<{
  candidateOptions: {
    id: string;
    date: string;
    counts: { ok: number; maybe: number; ng: number };
  }[];
  selectedCandidateId: string | null;
}>();

const emit = defineEmits<{
  select: [id: string];
}>();
</script>

<template>
  <p class="step-label">候補日を選んでください</p>
  <ul class="candidate-list">
    <li
      v-for="option in candidateOptions"
      :key="option.id"
      :class="[
        'candidate-item',
        { 'candidate-item--selected': selectedCandidateId === option.id },
      ]"
      @click="emit('select', option.id)"
    >
      <span class="candidate-date">{{
        formatDateWithWeekday(option.date)
      }}</span>
      <span class="candidate-counts">
        <span class="count ok">◯ {{ option.counts.ok }}</span>
        <span class="count maybe">△ {{ option.counts.maybe }}</span>
        <span class="count ng">× {{ option.counts.ng }}</span>
      </span>
    </li>
  </ul>
</template>

<style scoped>
.step-label {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0 0 var(--space-3);
}

.candidate-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.candidate-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    border-color 0.15s,
    background-color 0.15s;
  font-size: 14px;
}

.candidate-item:hover {
  border-color: var(--color-primary);
  background-color: var(--color-surface-raised);
}

.candidate-item--selected {
  border-color: var(--color-primary);
  background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.candidate-date {
  font-weight: 600;
}

.candidate-counts {
  display: flex;
  gap: var(--space-3);
  font-size: 13px;
}

.count.ok {
  color: var(--color-success, #2da44e);
}

.count.maybe {
  color: var(--color-warning, #bf8700);
}

.count.ng {
  color: var(--color-error, #cf222e);
}
</style>
