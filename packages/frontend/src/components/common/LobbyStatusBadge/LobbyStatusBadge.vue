<script setup lang="ts">
import { LobbyStatus } from '@taku-biyori/shared';
import { useLobbyStatusBadge } from '@/components/common/LobbyStatusBadge/useLobbyStatusBadge';

const props = defineProps<{
  status: LobbyStatus;
}>();

const { label, variant } = useLobbyStatusBadge(() => props.status);
</script>

<template>
  <span :class="['status-badge', `status-badge--${variant}`]">
    {{ label }}
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

.status-badge--primary {
  background: var(--primary-subtle);
  color: var(--primary-on-subtle);
  border-color: color-mix(in oklab, var(--primary) 32%, transparent);
}

.status-badge--warning {
  background: var(--warning-surface);
  color: var(--warning-text);
  border-color: color-mix(in oklab, var(--warning) 34%, transparent);
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
