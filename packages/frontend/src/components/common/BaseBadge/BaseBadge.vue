<script setup lang="ts">
type Variant =
  | 'default'
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'danger'
  | 'info';

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
  font-family:
    'Zen Kaku Gothic New', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
  font-size: var(--text-3xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  border-radius: var(--radius-full);
  white-space: nowrap;
  line-height: 1.4;
}

/* neutral / default — washi soft */
.badge--default,
.badge--neutral {
  background: var(--washi-100);
  color: var(--text-secondary);
}

/* primary — coral sun soft */
.badge--primary {
  background: var(--brand-primary-soft);
  color: var(--brand-primary-press);
}

/* secondary — sora soft */
.badge--secondary {
  background: var(--brand-secondary-soft);
  color: var(--brand-secondary-press);
}

/* success — moss soft */
.badge--success {
  background: var(--state-success-soft);
  color: var(--state-success);
}

/* warning — amber soft */
.badge--warning {
  background: var(--state-warning-soft);
  color: var(--state-warning);
}

/* error / danger — coral soft */
.badge--error,
.badge--danger {
  background: var(--state-danger-soft);
  color: var(--state-danger);
}

/* info — sora soft */
.badge--info {
  background: var(--state-info-soft);
  color: var(--state-info);
}

.badge-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.badge-dot--default,
.badge-dot--neutral {
  background: var(--text-tertiary);
}
.badge-dot--primary {
  background: var(--brand-primary);
}
.badge-dot--secondary {
  background: var(--brand-secondary);
}
.badge-dot--success {
  background: var(--state-success);
}
.badge-dot--warning {
  background: var(--state-warning);
}
.badge-dot--error,
.badge-dot--danger {
  background: var(--state-danger);
}
.badge-dot--info {
  background: var(--state-info);
}
</style>
