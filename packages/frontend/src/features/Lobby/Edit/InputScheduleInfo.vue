<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';
import { useCandidateDateRows } from '@/features/Lobby/Edit/composables/useCandidateDateRows';
import { formatDateWithWeekday } from '@/utils/date';
import type { LobbyCandidateDateInput } from '@taku-biyori/shared';
import { TIME_NOTE_MAX_LENGTH } from '@taku-biyori/shared';
import { CalendarDays, X } from '@lucide/vue';

const openUntil = defineModel<string>('openUntil', { default: '' });
const scheduledAt = defineModel<string>('scheduledAt', { default: '' });
/**
 * 候補日リスト。ローカル管理（pendingDates）とし、
 * 作成・更新のいずれのフローでも呼び出し元が一括で API に送信する。
 */
const pendingDates = defineModel<LobbyCandidateDateInput[]>('pendingDates', {
  default: () => [],
});

const { selectedDates, setDates, setTimeNote, removeDate } =
  useCandidateDateRows(pendingDates, (next) => {
    pendingDates.value = next;
  });

// 候補日への入力（ユーザー操作起点の set のみ）で開催日を破棄する。
function onDatesChange(value: string | string[] | undefined) {
  const dates = Array.isArray(value) ? value : [];
  setDates(dates);
  if (dates.length > 0) {
    scheduledAt.value = '';
  }
}

const timeNotePlaceholder = '例）19:00〜 / 午後から / 終日OK';
</script>

<template>
  <BaseCard>
    <template #header>
      <BaseSectionHeading level="h2" :icon="CalendarDays" text-color="default">
        実施情報
      </BaseSectionHeading>
    </template>

    <template #default>
      <div class="contents">
        <BaseDatePicker
          v-model="openUntil"
          label="募集締め切り日"
          disable-past
          clearable
        ></BaseDatePicker>

        <BaseDatePicker
          label="候補日"
          multiple
          disable-past
          required
          :model-value="selectedDates"
          @update:model-value="onDatesChange"
        ></BaseDatePicker>
      </div>

      <ul v-if="pendingDates.length" class="dates">
        <li v-for="item in pendingDates" :key="item.date" class="date-row">
          <span class="date-label">{{ formatDateWithWeekday(item.date) }}</span>
          <input
            class="time-note"
            type="text"
            :value="item.timeNote"
            :placeholder="timeNotePlaceholder"
            :maxlength="TIME_NOTE_MAX_LENGTH"
            :aria-label="`${formatDateWithWeekday(item.date)} の開催時間`"
            @input="
              setTimeNote(item.date, ($event.target as HTMLInputElement).value)
            "
          />
          <button
            type="button"
            class="remove"
            :aria-label="`${formatDateWithWeekday(item.date)} を削除`"
            @click="removeDate(item.date)"
          >
            <X :size="14" />
          </button>
        </li>
      </ul>

      <p class="info">
        ※ 候補日はロビー作成後も追加・削除できます。開催時間の記入は任意です。
      </p>
    </template>
  </BaseCard>
</template>

<style scoped>
.contents {
  /* 余白 */
  > * {
    margin: var(--space-5) 0;

    &:first-child {
      margin-top: 0;
    }
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.info {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-2);
}

.dates {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: var(--space-3) 0;
  padding: 0;
  list-style: none;
}

.date-row {
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr) 28px;
  align-items: center;
  gap: var(--space-3);
}

.date-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 12px;
  border-radius: var(--radius-full);
  background: color-mix(
    in srgb,
    var(--color-primary) 15%,
    var(--color-surface)
  );
  border: 1px solid
    color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
  color: var(--color-text);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.time-note {
  min-width: 0;
  padding: 8px 11px;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-family: inherit;
  font-size: 13px;
}

.time-note:not(:placeholder-shown) {
  border-style: solid;
}

.time-note::placeholder {
  color: var(--color-text-muted);
}

.time-note:focus-visible {
  outline: none;
  border-style: solid;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px
    color-mix(in srgb, var(--color-primary) 18%, transparent);
}

.remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
}

.remove:hover {
  color: var(--color-text);
  border-color: var(--color-border-strong);
}

.remove:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* 横幅が足りない端末では日付を上段、時刻メモを下段の全幅にする */
@media (max-width: 600px) {
  .date-row {
    grid-template-columns: minmax(0, 1fr) 28px;
    grid-template-areas:
      'date remove'
      'note note';
    gap: var(--space-2) var(--space-3);
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
  }

  .date-label {
    grid-area: date;
    justify-self: start;
  }

  .remove {
    grid-area: remove;
  }

  .time-note {
    grid-area: note;
  }
}
</style>
