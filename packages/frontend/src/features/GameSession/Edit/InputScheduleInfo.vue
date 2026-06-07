<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';
import BaseSwitch from '@/components/form/BaseSwitch/BaseSwitch.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import { useAvailabilityDates } from '@/features/GameSession/Edit/useAvailabilityDates';
import { CalendarDays } from '@lucide/vue';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  /** 更新フローのときのみ渡す。未指定のとき候補日モードは非表示 */
  gameSessionId?: string;
}>();

const openUntil = defineModel<string>('openUntil', { default: '' });
const scheduledAt = defineModel<string>('scheduledAt', { default: '' });
const location = defineModel<string>('location', { default: '' });

// 候補日モードは更新フロー（gameSessionId あり）のときのみ有効
const canSelectMultiDays = computed(() => !!props.gameSessionId);
const selectMultiDays = ref(false);

// gameSessionId がなくなったらスイッチをリセット
watch(canSelectMultiDays, (val) => {
  if (!val) {
    selectMultiDays.value = false;
  }
});

// 候補日 composable（gameSessionId がある場合のみ初期化）
const availability = props.gameSessionId
  ? useAvailabilityDates(props.gameSessionId)
  : null;

// BaseDatePicker(multiple) 用の選択済み日付リスト
const selectedDates = computed<string[]>(
  () => availability?.availabilityDates.value.map((d) => d.date) ?? [],
);

async function onDatesChange(newDates: string | string[]) {
  if (availability) {
    await availability.syncDates(Array.isArray(newDates) ? newDates : [newDates]);
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
        v-if="canSelectMultiDays"
        class="switch"
        v-model="selectMultiDays"
        label="複数の候補日を選択する"
      ></BaseSwitch>

      <div class="contents">
        <template v-if="selectMultiDays && canSelectMultiDays">
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
