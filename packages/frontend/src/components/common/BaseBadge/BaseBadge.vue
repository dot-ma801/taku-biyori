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
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-family: var(--font-family-base);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.03em;
  border-radius: var(--radius-full);
  white-space: nowrap;
  line-height: 1.4;
}

.badge--default {
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
}
.badge--primary {
  background: color-mix(
    in srgb,
    var(--color-primary) 15%,
    var(--color-surface)
  );
  color: var(--color-primary-text);
}
.badge--success {
  background: color-mix(
    in srgb,
    var(--color-success) 15%,
    var(--color-surface)
  );
  color: var(--color-success);
}
.badge--warning {
  background: color-mix(
    in srgb,
    var(--color-warning) 15%,
    var(--color-surface)
  );
  color: var(--color-warning);
}
.badge--error {
  background: color-mix(in srgb, var(--color-error) 15%, var(--color-surface));
  color: var(--color-error);
}

.badge-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.badge-dot--default {
  background: var(--color-text-muted);
}
.badge-dot--primary {
  background: var(--color-primary);
}
.badge-dot--success {
  background: var(--color-success);
}
.badge-dot--warning {
  background: var(--color-warning);
}
.badge-dot--error {
  background: var(--color-error);
}
</style>
