<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import { CalendarDays, X } from '@lucide/vue';
import type { PendingCandidateDate } from '@/features/Lobby/Edit/composables/pendingCandidateDates';
import {
  getDateNoteError,
  syncPendingDates,
} from '@/features/Lobby/Edit/composables/pendingCandidateDates';
import { computed } from 'vue';

const openUntil = defineModel<string>('openUntil', { default: '' });
const scheduledAt = defineModel<string>('scheduledAt', { default: '' });
/**
 * 候補日リスト。ローカル管理（pendingDates）とし、
 * 作成・更新のいずれのフローでも呼び出し元が一括で API に送信する。
 */
const pendingDates = defineModel<PendingCandidateDate[]>('pendingDates', {
  default: () => [],
});

// 日付ピッカーは日付の配列だけを扱う。ひとこととの突き合わせは composable に委ねる。
// 候補日への入力（ユーザー操作起点の set のみ）で開催日を破棄する。
const selectedDates = computed<string[]>({
  get() {
    return pendingDates.value.map((entry) => entry.date);
  },
  set(dates) {
    pendingDates.value = syncPendingDates(pendingDates.value, dates);
    if (dates.length > 0) {
      scheduledAt.value = '';
    }
  },
});

const hasDates = computed(() => pendingDates.value.length > 0);

const dateNoteRules = [(v: unknown) => getDateNoteError(v as string) ?? true];

function removeDate(date: string) {
  selectedDates.value = selectedDates.value.filter((d) => d !== date);
}

// ひとことは行ごとに更新する（配列要素を直接書き換えず、新しい配列に差し替える）
function updateDateNote(date: string, dateNote: string) {
  pendingDates.value = pendingDates.value.map((entry) =>
    entry.date === date ? { ...entry, dateNote } : entry,
  );
}
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
          v-model="selectedDates"
        ></BaseDatePicker>
      </div>

      <ul v-if="hasDates" class="dates">
        <li v-for="item in pendingDates" :key="item.date" class="date-row">
          <span class="date-label">{{ item.date }}</span>
          <BaseTextBox
            :model-value="item.dateNote"
            label="ひとこと"
            placeholder="例: 13:00〜 / 午後から"
            :rules="dateNoteRules"
            @update:model-value="updateDateNote(item.date, $event)"
          />
          <BaseButton
            variant="ghost"
            size="sm"
            :left-icon="X"
            @click="removeDate(item.date)"
          >
            削除
          </BaseButton>
        </li>
      </ul>

      <p class="info">
        ※ 候補日はロビー作成後も追加・削除できます。ひとことは任意です。
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
  gap: var(--space-3);
  margin: var(--space-3) 0;
  padding: 0;
  list-style: none;
}

/* PC は「日付・ひとこと・削除」を1行に収める */
.date-row {
  display: grid;
  grid-template-columns: max-content 1fr max-content;
  align-items: center;
  gap: var(--space-3);
}

.date-label {
  font-size: var(--font-size-sm);
  white-space: nowrap;
  color: var(--color-text);
}

/* 狭い画面では1行に収まらないので縦積みにする */
@media (max-width: 600px) {
  .date-row {
    grid-template-columns: 1fr max-content;
    row-gap: var(--space-2);
  }

  .date-label {
    grid-column: 1;
  }

  .date-row > :nth-child(2) {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
</style>
