<script setup lang="ts">
import { computed } from 'vue';
import { GameSessionStatus } from '@taku-biyori/shared';

const props = defineProps<{
  status: GameSessionStatus;
}>();

type Variant = 'muted' | 'success' | 'error';
type Appearance = { label: string; variant: Variant };

/**
 * 開催が取りうるステータスの表示定義（design-v2 §4-2 / §2-2）。
 *
 * 公開と受付はロビーの関心事へ移ったので、開催のステータスは4つだけ。
 */
const APPEARANCE_MAP = new Map<GameSessionStatus, Appearance>([
  [GameSessionStatus.scheduled, { label: '開催予定', variant: 'success' }],
  [GameSessionStatus.today, { label: '本日開催', variant: 'error' }],
  [GameSessionStatus.completed, { label: '完了', variant: 'muted' }],
  [GameSessionStatus.cancelled, { label: '中止', variant: 'error' }],
]);

const appearance = computed(() => APPEARANCE_MAP.get(props.status));
const badgeClass = computed(() =>
  appearance.value
    ? ['status-badge', `status-badge--${appearance.value.variant}`]
    : [],
);
</script>

<template>
  <span v-if="appearance" :class="badgeClass">
    {{ appearance.label }}
  </span>
</template>

<style scoped>
/* DS badge chrome: rectangular --radius-xs, tone surface + text pair,
   and a same-hue border at 34%. */
.status-badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  font: var(--text-label);
  font-weight: var(--weight-medium);
  border-radius: var(--radius-xs);
  border-width: var(--border-width);
  border-style: solid;
  white-space: nowrap;
}

.status-badge--muted {
  background: var(--surface-subtle);
  color: var(--text-secondary);
  border-color: var(--border);
}

.status-badge--success {
  background: var(--success-surface);
  color: var(--success-text);
  border-color: color-mix(in oklab, var(--success) 34%, transparent);
}

.status-badge--error {
  background: var(--error-surface);
  color: var(--error-text);
  border-color: color-mix(in oklab, var(--error) 34%, transparent);
}
</style>
