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
    <component :is="icon" :size="19" class="alert__icon" aria-hidden="true" />
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
      <X :size="16" />
    </button>
  </div>
</template>

<style scoped>
/* DS: tone surface + a same-hue border at 34%; the icon carries the tone
   colour, the body text stays --text-primary so it keeps reading as prose. */
.alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-sm);
  border-width: var(--border-width);
  border-style: solid;
  font-family: var(--font-body);
}

.alert--info {
  background: var(--info-surface);
  border-color: color-mix(in oklab, var(--info) 34%, transparent);
}
.alert--info .alert__icon {
  color: var(--info);
}
.alert--info .alert__title {
  color: var(--info-text);
}

.alert--success {
  background: var(--success-surface);
  border-color: color-mix(in oklab, var(--success) 34%, transparent);
}
.alert--success .alert__icon {
  color: var(--success);
}
.alert--success .alert__title {
  color: var(--success-text);
}

.alert--warning {
  background: var(--warning-surface);
  border-color: color-mix(in oklab, var(--warning) 34%, transparent);
}
.alert--warning .alert__icon {
  color: var(--warning);
}
.alert--warning .alert__title {
  color: var(--warning-text);
}

.alert--error {
  background: var(--error-surface);
  border-color: color-mix(in oklab, var(--error) 34%, transparent);
}
.alert--error .alert__icon {
  color: var(--error);
}
.alert--error .alert__title {
  color: var(--error-text);
}

.alert__icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.alert__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.alert__title {
  font: var(--text-body-sm);
  font-weight: var(--weight-semibold);
  margin: 0;
}

.alert__content {
  font: var(--text-body-sm);
  color: var(--text-primary);
}

.alert__dismiss {
  flex-shrink: 0;
  margin: -4px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  padding: 4px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  transition: var(--transition-control);
}
.alert__dismiss:hover {
  color: var(--text-primary);
  background: var(--surface-subtle);
}
.alert__dismiss:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
</style>
