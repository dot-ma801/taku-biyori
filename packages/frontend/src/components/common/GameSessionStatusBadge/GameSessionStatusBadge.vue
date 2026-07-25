<script setup lang="ts">
import { computed } from 'vue';
import { GameSessionStatus } from '@taku-biyori/shared';

const props = defineProps<{
  status: GameSessionStatus;
}>();

type Variant = 'muted' | 'success' | 'error';
type Appearance = { label: string; variant: Variant };

/**
 * 卓が取りうるステータスの表示定義。
 *
 * `open`（募集中）・`scheduling`（日程調整中）は募集枠（lobby）へ移管したため卓では表示しない。
 * enum からの削除は段階6c のため、旧経路で作られた卓が残っていてもバッジを描画しないよう
 * Partial（未定義なら非表示）で持つ。
 */
const APPEARANCE_MAP: Partial<Record<GameSessionStatus, Appearance>> = {
  [GameSessionStatus.draft]: { label: '非公開', variant: 'muted' },
  [GameSessionStatus.confirmed]: { label: '実施前', variant: 'success' },
  [GameSessionStatus.today]: { label: '当日', variant: 'error' },
  [GameSessionStatus.completed]: { label: '通過済み', variant: 'muted' },
  [GameSessionStatus.cancelled]: { label: '中止', variant: 'error' },
};

const appearance = computed(() => APPEARANCE_MAP[props.status]);
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
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  font-family: var(--font-family-base);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.03em;
  border-radius: var(--radius-full);
  white-space: nowrap;
  line-height: 1.4;
}

.status-badge--muted {
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
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
