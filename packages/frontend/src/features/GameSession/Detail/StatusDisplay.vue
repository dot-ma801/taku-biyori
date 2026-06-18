<script setup lang="ts">
import { computed } from 'vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import {
  type LucideIcon,
  EyeOff,
  Megaphone,
  CalendarClock,
  CalendarCheck,
  CircleDot,
  Flag,
} from '@lucide/vue';
import { GameSessionStatus } from '@taku-biyori/shared';

const props = defineProps<{ gameSessionStatus: GameSessionStatus }>();

type StatusAppearance = {
  label: string;
  text: string;
  variant: 'default' | 'primary' | 'success' | 'warning' | 'error';
  icon: LucideIcon;
};

const STATUS_APPEARANCE: Record<GameSessionStatus, StatusAppearance> = {
  [GameSessionStatus.draft]: {
    label: '非公開',
    text: 'まだ公開していません。準備ができたら公開しましょう。',
    variant: 'default',
    icon: EyeOff,
  },
  [GameSessionStatus.open]: {
    label: '募集中',
    text: '参加者を募集しています。',
    variant: 'primary',
    icon: Megaphone,
  },
  [GameSessionStatus.scheduling]: {
    label: '日程調整中',
    text: '募集を終了し、開催日を調整しています。',
    variant: 'warning',
    icon: CalendarClock,
  },
  [GameSessionStatus.confirmed]: {
    label: '実施前',
    text: '開催日が確定しました。当日を待っています。',
    variant: 'primary',
    icon: CalendarCheck,
  },
  [GameSessionStatus.today]: {
    label: '当日',
    text: '本日開催です。',
    variant: 'warning',
    icon: CircleDot,
  },
  [GameSessionStatus.completed]: {
    label: '通過済み',
    text: '開催を終えた卓です。',
    variant: 'success',
    icon: Flag,
  },
};

const appearance = computed(() => STATUS_APPEARANCE[props.gameSessionStatus]);
</script>

<template>
  <BaseCard>
    <div class="left-area">
      <component class="icon" :is="appearance.icon" />
      <BaseSectionHeading class="title-text" level="h3">
        {{ appearance.label }}
      </BaseSectionHeading>
      <p class="description-text">{{ appearance.text }}</p>
    </div>
  </BaseCard>
</template>

<style scoped>
.left-area {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr;
  align-items: center;
  gap: var(--space-1);

  .icon {
    grid-column: 1 / 2;
    grid-row: 1 / -1;
  }
  .title-text {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
  }
  .description-text {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
  }
}
</style>
