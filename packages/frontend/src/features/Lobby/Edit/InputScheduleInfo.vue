<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseChip from '@/components/common/BaseChip/BaseChip.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';
import { CalendarDays } from '@lucide/vue';
import { computed } from 'vue';

const openUntil = defineModel<string>('openUntil', { default: '' });
const scheduledAt = defineModel<string>('scheduledAt', { default: '' });
/**
 * 候補日リスト。ローカル管理（pendingDates）とし、
 * 作成・更新のいずれのフローでも呼び出し元が一括で API に送信する。
 */
const pendingDates = defineModel<string[]>('pendingDates', {
  default: () => [],
});

// 候補日への入力（ユーザー操作起点の set のみ）で開催日を破棄する。
const selectedDates = computed<string[]>({
  get() {
    return pendingDates.value;
  },
  set(dates) {
    pendingDates.value = dates;
    if (dates.length > 0) {
      scheduledAt.value = '';
    }
  },
});

function removeDate(date: string) {
  selectedDates.value = selectedDates.value.filter((d) => d !== date);
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
        ></BaseDatePicker>

        <BaseDatePicker
          label="候補日"
          multiple
          disable-past
          required
          v-model="selectedDates"
        ></BaseDatePicker>
      </div>

      <ul v-if="selectedDates.length" class="dates">
        <li v-for="item in selectedDates" :key="item">
          <BaseChip selected removable size="lg" @remove="removeDate(item)">
            {{ item }}
          </BaseChip>
        </li>
      </ul>

      <p class="info">※ 候補日はロビー作成後も追加・削除できます。</p>
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
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-3) 0;
  padding: 0;
  list-style: none;
}
</style>
