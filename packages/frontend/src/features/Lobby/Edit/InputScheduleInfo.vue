<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import { CalendarDays, X } from '@lucide/vue';
import { formatDateWithWeekday } from '@/utils/date';
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

      <template v-if="hasDates">
        <p class="dates-heading">候補日ごとのひとこと（任意）</p>
        <ul class="dates">
          <li v-for="item in pendingDates" :key="item.date" class="date-row">
            <!-- 入力欄のラベルは日付そのものにする。行ごとに「ひとこと」と
                 繰り返すより、どの日への入力かが直接わかる -->
            <BaseTextBox
              :model-value="item.dateNote"
              :label="formatDateWithWeekday(item.date)"
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
      </template>

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

.dates-heading {
  margin: var(--space-4) 0 var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.dates {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0 0 var(--space-3);
  padding: 0;
  list-style: none;
}

/*
 * 「入力欄（ラベル＝日付）・削除」を1行に収める。
 * 上限20字の入力に幅いっぱいを与えても読みやすくならないので 24em で止める。
 * align-items: end で、入力欄の上に載るラベルぶんを無視して削除ボタンを
 * 入力欄と同じ高さに揃える。
 */
.date-row {
  display: grid;
  grid-template-columns: minmax(0, 24em) max-content;
  align-items: end;
  gap: var(--space-3);
}

/* 狭い画面では入力欄と削除ボタンを縦に積む */
@media (max-width: 600px) {
  .date-row {
    grid-template-columns: 1fr;
    row-gap: var(--space-2);
  }

  /* 入力欄は幅いっぱい、削除ボタンだけ左寄せで下に置く */
  .date-row > :last-child {
    justify-self: start;
  }
}
</style>
