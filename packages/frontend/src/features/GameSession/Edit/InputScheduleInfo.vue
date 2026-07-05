<script setup lang="ts">
import BaseBadge from '@/components/common/BaseBadge/BaseBadge.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseChip from '@/components/common/BaseChip/BaseChip.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';
import BaseSwitch from '@/components/form/BaseSwitch/BaseSwitch.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import { useAvailabilityDates } from '@/features/GameSession/Edit/useAvailabilityDates';
import { CalendarDays } from '@lucide/vue';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  /** 更新フローのときのみ渡す。未指定のとき候補日はローカル管理（pendingDates） */
  gameSessionId?: string;
  /** 更新フローで日程が確定済みのとき true。候補日セクションを非表示にする */
  isScheduled?: boolean;
}>();

const openUntil = defineModel<string>('openUntil', { default: '' });
const scheduledAt = defineModel<string>('scheduledAt', { default: '' });
const location = defineModel<string>('location', { default: '' });
/**
 * 新規作成フロー用の候補日リスト。
 * gameSessionId がない場合にのみ使用し、セッション作成後に呼び出し元が一括 POST する。
 */
const pendingDates = defineModel<string[]>('pendingDates', {
  default: () => [],
});

const selectMultiDays = ref(false);
const effectiveSelectMultiDays = computed(
  () => !props.isScheduled && selectMultiDays.value,
);

// 更新フロー: API と同期する composable
const availability = props.gameSessionId
  ? useAvailabilityDates(props.gameSessionId)
  : null;

// 複数日 picker 用の writable computed
// get: API 管理 or ローカル管理の日付リストを返す
// set: 更新フローは差分を API に送信、新規作成フローはローカルに保持
const selectedDates = computed<string[]>({
  get() {
    if (availability) {
      return availability.availabilityDates.value.map((d) => d.date);
    }
    return pendingDates.value;
  },
  set(dates) {
    if (availability) {
      availability.syncDates(dates);
    } else {
      pendingDates.value = dates;
    }
  },
});

// 候補日に値が入ったら、開催日の入力状態を破棄する
watch(selectedDates, (dates) => {
  if (dates.length > 0) {
    scheduledAt.value = '';
  }
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
      <BaseSwitch
        v-if="!props.isScheduled"
        class="switch"
        v-model="selectMultiDays"
        label="複数の候補日を選択する"
      ></BaseSwitch>

      <div class="contents">
        <template v-if="effectiveSelectMultiDays">
          <BaseDatePicker
            label="候補日"
            multiple
            v-model="selectedDates"
          ></BaseDatePicker>
          <p v-if="availability?.errorMessage.value" class="error">
            {{ availability.errorMessage.value }}
          </p>
          <ul class="dates">
            <li v-for="item in selectedDates" :key="item">
              <BaseChip selected removable size="lg" @remove="removeDate(item)">
                {{ item }}
              </BaseChip>
            </li>
          </ul>
        </template>

        <BaseDatePicker
          v-else
          v-model="scheduledAt"
          label="開催日"
        ></BaseDatePicker>

        <BaseDatePicker
          v-model="openUntil"
          label="募集締め切り日"
        ></BaseDatePicker>

        <BaseTextBox
          v-model="location"
          label="実施場所"
          placeholder="例：Discord + ココフォリア"
        ></BaseTextBox>
      </div>
    </template>
  </BaseCard>
</template>

<style scoped>
.switch {
  margin-bottom: var(--space-4);
}

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

.error {
  font-size: 13px;
  color: var(--color-error);
  margin-top: var(--space-2);
}

.dates {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
