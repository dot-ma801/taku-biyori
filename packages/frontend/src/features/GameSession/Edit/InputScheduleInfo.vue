<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';
import BaseSwitch from '@/components/form/BaseSwitch/BaseSwitch.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import { useAvailabilityDates } from '@/features/GameSession/Edit/useAvailabilityDates';
import { CalendarDays } from '@lucide/vue';
import { computed, ref } from 'vue';

const props = defineProps<{
  /** 更新フローのときのみ渡す。未指定のとき候補日はローカル管理（pendingDates） */
  gameSessionId?: string;
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

// 更新フロー: API と同期する composable
const availability = props.gameSessionId
  ? useAvailabilityDates(props.gameSessionId)
  : null;

// 複数日 picker に渡す日付リスト
const selectedDates = computed<string[]>(() => {
  if (availability) {
    return availability.availabilityDates.value.map((d) => d.date);
  }
  return pendingDates.value;
});

async function onDatesChange(newDates: string | string[]) {
  const dates = Array.isArray(newDates) ? newDates : [newDates];
  if (availability) {
    // 更新フロー: 差分を API に送信
    await availability.syncDates(dates);
  } else {
    // 新規作成フロー: ローカルに保持
    pendingDates.value = dates;
  }
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
        class="switch"
        v-model="selectMultiDays"
        label="複数の候補日を選択する"
      ></BaseSwitch>

      <div class="contents">
        <template v-if="selectMultiDays">
          <BaseDatePicker
            label="候補日"
            multiple
            :model-value="selectedDates"
            @update:model-value="onDatesChange"
          ></BaseDatePicker>
          <p v-if="availability?.errorMessage.value" class="error">
            {{ availability.errorMessage.value }}
          </p>
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
</style>
