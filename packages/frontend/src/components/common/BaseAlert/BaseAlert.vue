<script setup lang="ts">
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from '@lucide/vue'
import { computed } from 'vue'

type Variant = 'info' | 'success' | 'warning' | 'error'

const props = withDefaults(defineProps<{
  variant?: Variant
  title?: string
  dismissible?: boolean
}>(), {
  variant: 'info',
})

const emit = defineEmits<{ dismiss: [] }>()

const icon = computed(() => ({
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
})[props.variant])
</script>

<template>
  <div :class="['alert', `alert--${variant}`]" role="alert">
    <component :is="icon" :size="16" class="alert__icon" aria-hidden="true" />
    <div class="alert__body">
      <p v-if="title" class="alert__title">{{ title }}</p>
      <div class="alert__content"><slot /></div>
    </div>
    <button v-if="dismissible" class="alert__dismiss" aria-label="閉じる" @click="emit('dismiss')">
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
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  font-family: var(--font-family-base);
  font-size: 14px;
  line-height: 1.55;
}

.alert--info {
  background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-border));
  color: var(--color-text);
}
.alert--info .alert__icon { color: var(--color-primary); }

.alert--success {
  background: color-mix(in srgb, var(--color-success) 12%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-success) 30%, var(--color-border));
  color: var(--color-text);
}
.alert--success .alert__icon { color: var(--color-success); }

.alert--warning {
  background: color-mix(in srgb, var(--color-warning) 12%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-warning) 30%, var(--color-border));
  color: var(--color-text);
}
.alert--warning .alert__icon { color: var(--color-warning); }

.alert--error {
  background: color-mix(in srgb, var(--color-error) 12%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-error) 30%, var(--color-border));
  color: var(--color-text);
}
.alert--error .alert__icon { color: var(--color-error); }

.alert__icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.alert__body {
  flex: 1;
}

.alert__title {
  font-weight: 600;
  font-size: 13px;
  margin: 0 0 2px;
}

.alert__content {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.alert__dismiss {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 2px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  transition: color 0.15s;
}
.alert__dismiss:hover {
  color: var(--color-text);
}
</style>
