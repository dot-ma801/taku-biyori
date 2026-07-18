<script setup lang="ts">
import { computed } from 'vue';
import { LobbyStatus } from '@taku-biyori/shared';

const props = defineProps<{
  status: LobbyStatus;
}>();

type Variant = 'muted' | 'primary' | 'warning' | 'success' | 'error';

const LABEL_MAP: Record<LobbyStatus, string> = {
  [LobbyStatus.draft]: '非公開',
  [LobbyStatus.open]: '募集中',
  [LobbyStatus.scheduling]: '日程調整中',
  [LobbyStatus.confirmed]: '卓確定済み',
  [LobbyStatus.cancelled]: '中止',
};

const VARIANT_MAP: Record<LobbyStatus, Variant> = {
  [LobbyStatus.draft]: 'muted',
  [LobbyStatus.open]: 'primary',
  [LobbyStatus.scheduling]: 'warning',
  [LobbyStatus.confirmed]: 'success',
  [LobbyStatus.cancelled]: 'error',
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
