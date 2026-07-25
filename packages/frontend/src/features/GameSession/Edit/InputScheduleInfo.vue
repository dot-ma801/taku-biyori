<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import { CalendarDays } from '@lucide/vue';

/**
 * 卓は日程が確定した状態でのみ存在するため、開催日は必須入力とする（design-v1.1 §8）。
 * 候補日・募集締め切りは募集枠（lobby）の関心事なのでこの画面では扱わない。
 */
const scheduledAt = defineModel<string>('scheduledAt', { default: '' });
const location = defineModel<string>('location', { default: '' });
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
          v-model="scheduledAt"
          label="開催日"
          disable-past
          required
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
