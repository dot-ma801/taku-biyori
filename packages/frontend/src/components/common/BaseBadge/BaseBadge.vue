<script setup lang="ts">
type Variant = 'default' | 'primary' | 'success' | 'warning' | 'error';

withDefaults(
  defineProps<{
    variant?: Variant;
    dot?: boolean;
  }>(),
  {
    variant: 'default',
  },
);
</script>

<template>
  <span
    v-if="dot"
    :class="['badge-dot', `badge-dot--${variant}`]"
    aria-hidden="true"
  />
  <span v-else :class="['badge', `badge--${variant}`]">
    <slot />
  </span>
</template>

<style scoped>
/* DS: badges stay rectangular at --radius-xs so they don't read as pills.
   Tone = surface + text pair + a 34% border of the same hue. */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 9px;
  font: var(--text-label);
  font-weight: var(--weight-medium);
  border-radius: var(--radius-xs);
  border-width: var(--border-width);
  border-style: solid;
  white-space: nowrap;
}

.badge--default {
  background: var(--surface-subtle);
  color: var(--text-secondary);
  border-color: var(--border);
}
.badge--primary {
  background: var(--primary-subtle);
  color: var(--primary-on-subtle);
  border-color: color-mix(in oklab, var(--primary) 32%, transparent);
}
.badge--success {
  background: var(--success-surface);
  color: var(--success-text);
  border-color: color-mix(in oklab, var(--success) 34%, transparent);
}
.badge--warning {
  background: var(--warning-surface);
  color: var(--warning-text);
  border-color: color-mix(in oklab, var(--warning) 34%, transparent);
}
.badge--error {
  background: var(--error-surface);
  color: var(--error-text);
  border-color: color-mix(in oklab, var(--error) 34%, transparent);
}

.badge-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.badge-dot--default {
  background: var(--text-tertiary);
}
.badge-dot--primary {
  background: var(--primary);
}
.badge-dot--success {
  background: var(--success);
}
.badge-dot--warning {
  background: var(--warning);
}
.badge-dot--error {
  background: var(--error);
}
</style>
