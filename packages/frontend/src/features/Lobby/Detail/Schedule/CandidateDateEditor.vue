<script setup lang="ts">
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import { X } from '@lucide/vue';
import { formatDateWithWeekday } from '@/utils/date';
import type { PendingCandidateDate } from '@/utils/pendingCandidateDates';
import {
  getTimeLabelCounter,
  getTimeLabelError,
  syncPendingDates,
} from '@/utils/pendingCandidateDates';
import { computed } from 'vue';

/**
 * 候補日 + ひとこと（timeLabel）の入力 UI。
 * 「日程調整をやり直す」（RestartSchedulePoll.vue）と
 * 「候補日を編集」（CandidateDateEditSection.vue）の両方から使う。
 * `Edit/InputScheduleInfo.vue` の候補日入力部分を参考にしているが、
 * 実装詳細を Schedule/ の外に漏らさないため意図的に別実装として持つ
 * （共通のロジックは `@/utils/pendingCandidateDates` に寄せている）。
 */

const pendingDates = defineModel<PendingCandidateDate[]>({
  default: () => [],
});

// 日付ピッカーは日付の配列だけを扱う。ひとこととの突き合わせは utils に委ねる。
const selectedDates = computed<string[]>({
  get() {
    return pendingDates.value.map((entry) => entry.date);
  },
  set(dates) {
    pendingDates.value = syncPendingDates(pendingDates.value, dates);
  },
});

const hasDates = computed(() => pendingDates.value.length > 0);

// 表示用の行データ。日付の整形とひとことカウンターの導出をここに集約し、
// template 側では算出済みの値を参照するだけにする。
const dateRows = computed(() =>
  pendingDates.value.map((entry) => ({
    date: entry.date,
    timeLabel: entry.timeLabel,
    dateLabel: formatDateWithWeekday(entry.date),
    counter: getTimeLabelCounter(entry.timeLabel),
  })),
);

const timeLabelRules = [(v: unknown) => getTimeLabelError(v as string) ?? true];

function removeDate(date: string) {
  selectedDates.value = selectedDates.value.filter((d) => d !== date);
}

// ひとことは行ごとに更新する（配列要素を直接書き換えず、新しい配列に差し替える）
function updateTimeLabel(date: string, timeLabel: string) {
  pendingDates.value = pendingDates.value.map((entry) =>
    entry.date === date ? { ...entry, timeLabel } : entry,
  );
}
</script>

<template>
  <div class="candidate-date-editor">
    <BaseDatePicker
      label="候補日"
      multiple
      disable-past
      required
      v-model="selectedDates"
    ></BaseDatePicker>

    <ul v-if="hasDates" class="dates">
      <li v-for="row in dateRows" :key="row.date" class="date-row">
        <label class="date-field">
          <span class="date-text">{{ row.dateLabel }}</span>
          <BaseTextBox
            class="note-input"
            :model-value="row.timeLabel"
            placeholder="例）19:00〜 / 午後から / 終日OK"
            :rules="timeLabelRules"
            @update:model-value="updateTimeLabel(row.date, $event)"
          />
        </label>
        <span class="counter" :class="{ 'counter--over': row.counter.isOver }">
          {{ row.counter.label }}
        </span>
        <BaseButton
          class="remove"
          variant="ghost"
          size="sm"
          :left-icon="X"
          :aria-label="`${row.dateLabel} を候補日から外す`"
          @click="removeDate(row.date)"
        />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.candidate-date-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.dates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20em, 1fr));
  max-width: 52em;
  gap: var(--space-3) var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.date-row {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr) max-content;
  grid-template-areas:
    'date input close'
    '.    counter .';
  align-items: center;
  column-gap: var(--space-2);
  row-gap: 2px;
  padding: var(--space-3);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.date-field {
  display: contents;
}

.date-text {
  grid-area: date;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
  cursor: pointer;
}

.note-input {
  grid-area: input;
}

.counter {
  grid-area: counter;
  color: var(--color-text-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.counter--over {
  color: var(--color-error);
  font-weight: 500;
}

.remove {
  grid-area: close;
}

@media (max-width: 600px) {
  .dates {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    max-width: none;
  }

  .date-row {
    grid-template-columns: minmax(0, 1fr) max-content;
    grid-template-areas:
      'head close'
      'input input'
      'counter counter';
    gap: var(--space-2);
  }

  .date-text {
    grid-area: head;
    color: var(--color-text);
  }
}
</style>
