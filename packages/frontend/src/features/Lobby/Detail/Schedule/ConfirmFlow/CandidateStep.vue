<script setup lang="ts">
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';
import type { DateMode } from '@/features/Lobby/Detail/Schedule/ConfirmFlow/useConfirmFlow';
import { formatDateWithWeekday } from '@/utils/date';

defineProps<{
  candidateOptions: {
    id: string;
    date: string;
    timeLabel: string | null;
    counts: { ok: number; maybe: number; ng: number };
  }[];
  selectedCandidateId: string | null;
  dateMode: DateMode;
  directDate: string;
  loading: boolean;
}>();

const emit = defineEmits<{
  select: [id: string];
  'change-mode': [mode: DateMode];
  'change-direct-date': [date: string];
}>();
</script>

<template>
  <!-- 開催日の決め方は2経路（design-v2 §7 ステップ1）。
       日程調整を回していないロビーは候補日が無いので直接入力しか通らない -->
  <div class="mode-switch" role="group" aria-label="開催日の決め方">
    <button
      type="button"
      :class="[
        'mode-item',
        { 'mode-item--selected': dateMode === 'candidate' },
      ]"
      :aria-pressed="dateMode === 'candidate'"
      @click="emit('change-mode', 'candidate')"
    >
      候補日から選ぶ
    </button>
    <button
      type="button"
      :class="['mode-item', { 'mode-item--selected': dateMode === 'direct' }]"
      :aria-pressed="dateMode === 'direct'"
      @click="emit('change-mode', 'direct')"
    >
      直接日付を入れる
    </button>
  </div>

  <template v-if="dateMode === 'candidate'">
    <p class="step-label">日程調整の候補日から開催日を選んでください</p>
    <p v-if="loading" class="empty">候補日を読み込んでいます…</p>
    <p v-else-if="candidateOptions.length === 0" class="empty">
      候補日がありません。日程調整で候補日を追加するか、直接日付を入れてください
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

  <template v-else>
    <p class="step-label">開催日を直接入力してください</p>
    <BaseDatePicker
      :model-value="directDate"
      label="開催日"
      disable-past
      required
      @update:model-value="emit('change-direct-date', String($event ?? ''))"
    ></BaseDatePicker>
  </template>
</template>

<style scoped>
.mode-switch {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}
.mode-item {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
}
.mode-item:hover,
.mode-item--selected {
  border-color: var(--color-primary);
  background: var(--color-surface-raised);
}
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
  color: var(--color-success);
}
.maybe {
  color: var(--color-warning);
}
.ng {
  color: var(--color-error);
}
</style>
