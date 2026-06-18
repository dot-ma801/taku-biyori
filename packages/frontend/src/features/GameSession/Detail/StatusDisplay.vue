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
    variant: 'success',
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
  <BaseCard :data-variant="appearance.variant" class="status-card">
    <div class="left-area">
      <div class="icon-wrapper">
        <component class="icon" :is="appearance.icon" />
      </div>
      <BaseSectionHeading class="title-text" level="h3">
        {{ appearance.label }}
      </BaseSectionHeading>
      <p class="description-text">{{ appearance.text }}</p>
    </div>
  </BaseCard>
</template>

<style scoped>
.status-card {
  --status-color: var(--color-secondary);
  --status-bg: var(--color-surface-muted);
  --status-bg-subtle: color-mix(in srgb, var(--status-bg) 40%, var(--color-surface));
}

[data-variant='primary'] {
  --status-color: var(--color-primary);
  --status-bg: var(--color-primary-soft);
}
[data-variant='warning'] {
  --status-color: var(--color-warning);
  --status-bg: var(--color-warning-soft);
}
[data-variant='success'] {
  --status-color: var(--color-success);
  --status-bg: var(--color-success-soft);
}
[data-variant='error'] {
  --status-color: var(--color-error);
  --status-bg: var(--color-error-soft);
}

/* .status-card[data-variant] の specificity (0,2,0) が
   BaseCard 内の .card (0,1,0) より高いので :deep() 不要 */
.status-card[data-variant] {
  border-left: 3px solid var(--status-color);
  background: var(--status-bg-subtle);
}

.left-area {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr;
  align-items: center;
  gap: var(--space-1);

  .icon-wrapper {
    grid-column: 1 / 2;
    grid-row: 1 / -1;

    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-2);
    background: var(--status-bg);
    border-radius: var(--radius-sm);
    margin-right: var(--space-2);
  }

  .icon {
    color: var(--status-color);
  }
  .title-text {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
  }
  .description-text {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
    margin: 0;
  }
}
</style>
