<script setup lang="ts">
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from '@lucide/vue';
import { computed } from 'vue';

type Variant = 'info' | 'success' | 'warning' | 'error';

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    title?: string;
    dismissible?: boolean;
  }>(),
  {
    variant: 'info',
  },
);

const emit = defineEmits<{ dismiss: [] }>();

const icon = computed(
  () =>
    ({
      info: Info,
      success: CheckCircle,
      warning: AlertTriangle,
      error: AlertCircle,
    })[props.variant],
);
</script>

<template>
  <div :class="['alert', `alert--${variant}`]" role="alert">
    <component :is="icon" :size="16" class="alert__icon" aria-hidden="true" />
    <div class="alert__body">
      <p v-if="title" class="alert__title">{{ title }}</p>
      <div class="alert__content"><slot /></div>
    </div>
    <button
      v-if="dismissible"
      class="alert__dismiss"
      aria-label="閉じる"
      @click="emit('dismiss')"
    >
      <X :size="14" />
    </button>
  </div>
</template>

<style scoped>
.alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  font-family:
    'Zen Kaku Gothic New', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
  font-size: var(--text-sm);
  line-height: var(--leading-snug);
  color: var(--text-primary);
}

.alert--info {
  background: var(--state-info-soft);
  border-color: var(--brand-secondary-border);
}
.alert--info .alert__icon {
  color: var(--state-info);
}

.alert--success {
  background: var(--state-success-soft);
  border-color: var(--moss-400);
}
.alert--success .alert__icon {
  color: var(--state-success);
}

.alert--warning {
  background: var(--state-warning-soft);
  border-color: var(--amber-400);
}
.alert--warning .alert__icon {
  color: var(--state-warning);
}

.alert--error {
  background: var(--state-danger-soft);
  border-color: var(--coral-400);
}
.alert--error .alert__icon {
  color: var(--state-danger);
}

.alert__icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.alert__body {
  flex: 1;
}

.alert__title {
  font-weight: var(--weight-medium);
  font-size: var(--text-sm);
  margin: 0 0 2px;
  color: var(--text-primary);
}

.alert__content {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.alert__dismiss {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  padding: 2px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  transition: color var(--duration-fast) var(--ease-standard);
}
.alert__dismiss:hover {
  color: var(--text-primary);
}
</style>
