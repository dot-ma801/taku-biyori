<script setup lang="ts">
import { computed } from 'vue';
import { GameSessionStatus } from '@taku-biyori/shared';

const props = defineProps<{
  status: GameSessionStatus;
}>();

type Variant = 'muted' | 'primary' | 'warning' | 'success' | 'error';

const LABEL_MAP: Record<GameSessionStatus, string> = {
  [GameSessionStatus.draft]: '非公開',
  [GameSessionStatus.open]: '募集中',
  [GameSessionStatus.scheduling]: '日程調整中',
  [GameSessionStatus.confirmed]: '実施前',
  [GameSessionStatus.today]: '当日',
  [GameSessionStatus.completed]: '通過済み',
  [GameSessionStatus.cancelled]: '中止',
};

const VARIANT_MAP: Record<GameSessionStatus, Variant> = {
  [GameSessionStatus.draft]: 'muted',
  [GameSessionStatus.open]: 'primary',
  [GameSessionStatus.scheduling]: 'warning',
  [GameSessionStatus.confirmed]: 'success',
  [GameSessionStatus.today]: 'error',
  [GameSessionStatus.completed]: 'muted',
  [GameSessionStatus.cancelled]: 'error',
};

const label = computed(() => LABEL_MAP[props.status]);
const variant = computed(() => VARIANT_MAP[props.status]);
</script>

<template>
  <span :class="['status-badge', `status-badge--${variant}`]">
    {{ label }}
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  font-family: var(--font-family-base);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  border-radius: var(--radius-full);
  white-space: nowrap;
  line-height: 1.4;
}

.status-badge--muted {
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
}

.status-badge--primary {
  background: color-mix(
    in srgb,
    var(--color-primary) 15%,
    var(--color-surface)
  );
  color: var(--color-primary);
}

.status-badge--warning {
  background: color-mix(
    in srgb,
    var(--color-warning) 15%,
    var(--color-surface)
  );
  color: var(--color-warning);
}

.status-badge--success {
  background: color-mix(
    in srgb,
    var(--color-success) 15%,
    var(--color-surface)
  );
  color: var(--color-success);
}

.status-badge--error {
  background: color-mix(in srgb, var(--color-error) 15%, var(--color-surface));
  color: var(--color-error);
}
</style>
