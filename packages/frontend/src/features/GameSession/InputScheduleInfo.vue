<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';
import BaseDateTimePicker from '@/components/form/BaseDateTimePicker/BaseDateTimePicker.vue';
import BaseSwitch from '@/components/form/BaseSwitch/BaseSwitch.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import { CalendarDays } from '@lucide/vue';
import { ref } from 'vue';

const selectMultiDays = ref(false)
</script>

<template>
  <BaseCard>
    <template #header>
      <BaseSectionHeading level="h2" :icon="CalendarDays" text-color="default">
        実施情報
      </BaseSectionHeading>
    </template>

    <template #default>
      <BaseSwitch class="switch" v-model="selectMultiDays" label="複数の候補日を選択する"></BaseSwitch>
      <div class="contents">
        <BaseDatePicker  v-if="selectMultiDays" label="候補日" multiple></BaseDatePicker>
        <BaseDateTimePicker v-else label="開催日時"></BaseDateTimePicker>
        <BaseTextBox label="実施場所" placeholder="例：Discord + ココフォリア"></BaseTextBox>
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
</style>
