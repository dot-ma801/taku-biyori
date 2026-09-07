<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import { CalendarDays } from '@lucide/vue';

import { computed } from 'vue';

/**
 * 開催は生まれた時点で日程が決まっているため、開催日は必須入力とする（design-v2 §3-7）。
 * 候補日・受付の締め切りはロビーの関心事なのでこの画面では扱わない。
 *
 * 実施場所はこの開催だけの上書き。空欄ならロビーの値に追随する（design-v2 §5-5）。
 */
const props = defineProps<{ lobbyLocation?: string | null }>();

const scheduledAt = defineModel<string>('scheduledAt', { default: '' });
const location = defineModel<string>('location', { default: '' });
const timeLabel = defineModel<string>('timeLabel', { default: '' });

const locationPlaceholder = computed(() =>
  props.lobbyLocation
    ? `未入力なら「${props.lobbyLocation}」`
    : '例：Discord + ココフォリア',
);
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
          v-model="timeLabel"
          label="時間帯"
          placeholder="例：19:00〜"
          maxlength="20"
        ></BaseTextBox>

        <BaseTextBox
          v-model="location"
          label="実施場所"
          :placeholder="locationPlaceholder"
        ></BaseTextBox>
      </div>
    </template>
  </BaseCard>
</template>

<style scoped>
.contents {
  /* 余白 */
  > * {
    margin: var(--space-6) 0;

    &:first-child {
      margin-top: 0;
    }
    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
