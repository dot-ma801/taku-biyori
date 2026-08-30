<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import { CalendarDays, X } from '@lucide/vue';
import { formatDateWithWeekday } from '@/utils/date';
import type { PendingCandidateDate } from '@/utils/pendingCandidateDates';
import {
  getTimeLabelCounter,
  getTimeLabelError,
  syncPendingDates,
} from '@/utils/pendingCandidateDates';
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
const props = withDefaults(
  defineProps<{
    showCandidateDates?: boolean;
  }>(),
  { showCandidateDates: true },
);

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
  <BaseCard>
    <template #header>
      <BaseSectionHeading level="h2" :icon="CalendarDays" text-color="default">
        実施情報
      </BaseSectionHeading>
    </template>

    <template #default>
      <div class="contents">
        <BaseDatePicker
          v-if="props.showCandidateDates"
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

      <ul v-if="props.showCandidateDates && hasDates" class="dates">
        <li v-for="row in dateRows" :key="row.date" class="date-row">
          <!--
            日付は入力欄の行ラベル。label で包むと for/id なしで暗黙的に
            関連付けられるので、BaseTextBox に label を渡さなくても
            アクセシブルネームが付く（日付をクリックで入力欄にフォーカスも入る）。
            削除ボタンは label の外に置く（中に入れると押下で入力欄にフォーカスが移る）。
          -->
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
          <span
            class="counter"
            :class="{ 'counter--over': row.counter.isOver }"
          >
            {{ row.counter.label }}
          </span>
          <!-- アイコンのみのボタン。ラベル文字列は aria-label で補う
               （親が渡した aria-label は BaseButton 側の指定より優先される） -->
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

      <p v-if="props.showCandidateDates" class="info">
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
 * 候補日は2列に並べる。1列だと候補日が増えたぶんだけ縦に伸び、
 * 上限20字の入力に対して横幅が余りすぎる。
 * auto-fit と max-width の組み合わせで、幅が足りなければ自動で1列に落ちる。
 */
.dates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20em, 1fr));
  max-width: 52em;
  gap: var(--space-3) var(--space-4);
  margin: var(--space-4) 0 0;
  padding: 0;
  list-style: none;
}

/*
 * 1件ぶんの内訳。日付と削除ボタンは入力欄と同じ行に置き、
 * カウンターだけ入力欄の下（左寄せ）に回す。
 *
 * 2列に並べると隣の候補日と横に接するため、1件ずつを枠付きの面にして
 * どこまでが1件かを明示する（余白だけで分けると、左の削除ボタンと
 * 右の日付が地続きに見えてしまう）。狭い画面のカードと同じ扱いなので、
 * PC とモバイルで見え方の理屈も揃う。
 */
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

/* 文字数カウンター。プレイメモ（PlayMemoEditor）と同じ `N / MAX` 形式に揃える */
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

/* 狭い画面では1列に落とし、日付と削除を上段、入力欄を全幅で下段に置く */
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
