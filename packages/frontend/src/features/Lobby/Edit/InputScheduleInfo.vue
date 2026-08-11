<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
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

      <ul v-if="hasDates" class="dates">
        <li v-for="item in pendingDates" :key="item.date" class="date-row">
          <!--
            日付は入力欄の行ラベル。label で包むと for/id なしで暗黙的に
            関連付けられるので、BaseTextBox に label を渡さなくても
            アクセシブルネームが付く（日付をクリックで入力欄にフォーカスも入る）。
            削除ボタンは label の外に置く（中に入れると押下で入力欄にフォーカスが移る）。
          -->
          <label class="date-field">
            <span class="date-text">{{
              formatDateWithWeekday(item.date)
            }}</span>
            <BaseTextBox
              class="note-input"
              :model-value="item.dateNote"
              placeholder="例）19:00〜 / 午後から / 終日OK"
              :rules="dateNoteRules"
              @update:model-value="updateDateNote(item.date, $event)"
            />
          </label>
          <button
            type="button"
            class="remove"
            :aria-label="`${formatDateWithWeekday(item.date)} を候補日から外す`"
            @click="removeDate(item.date)"
          >
            <X :size="14" />
          </button>
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

/*
 * 「日付・入力欄・削除」を1行に並べる。グリッドは行ごとではなく ul 側に持たせ、
 * 行と label を display: contents にして全行を同じ列に載せる
 * （行ごとに grid を作ると、日付の文字数が違う行で入力欄の開始位置がずれる）。
 * 上限20字の入力に幅いっぱいを与えても読みやすくならないので 24em で止め、
 * 余った幅は使わずに左寄せする。
 */
.dates {
  display: grid;
  grid-template-columns: max-content minmax(0, 24em) max-content;
  justify-content: start;
  align-items: center;
  gap: var(--space-2) var(--space-3);
  margin: var(--space-4) 0 0;
  padding: 0;
  list-style: none;
}

.date-row,
.date-field {
  display: contents;
}

.date-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
  cursor: pointer;
}

.remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;
}

.remove:hover {
  border-color: var(--color-error);
  color: var(--color-error);
}

.remove:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

/*
 * 狭い画面では候補日ごとに枠付きカードにする。上段に日付と削除、下段に入力欄。
 * 背景を一段濃くして、カードの境目が枠線だけに頼らないようにする。
 */
@media (max-width: 600px) {
  .dates {
    display: flex;
    flex-direction: column;
    /* グリッド用に指定した align-items: center が flex にも効くと、
       カードが内容幅に縮んで中央寄せになるため明示的に戻す */
    align-items: stretch;
    gap: var(--space-3);
  }

  .date-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) max-content;
    grid-template-areas:
      'head close'
      'input input';
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .date-text {
    grid-area: head;
    color: var(--color-text);
  }

  .note-input {
    grid-area: input;
  }

  .remove {
    grid-area: close;
  }
}
</style>
