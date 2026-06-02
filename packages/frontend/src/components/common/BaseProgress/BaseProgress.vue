<script setup lang="ts">
import { Progress } from '@vuetify/v0';

type Variant = 'default' | 'success' | 'warning' | 'error';

withDefaults(
  defineProps<{
    value?: number;
    max?: number;
    indeterminate?: boolean;
    variant?: Variant;
    label?: string;
    showValue?: boolean;
    size?: 'sm' | 'md';
  }>(),
  {
    max: 100,
    variant: 'default',
    size: 'md',
  },
);
</script>

<template>
  <Progress.Root
    :model-value="indeterminate ? undefined : value"
    :max="max"
    :indeterminate="indeterminate"
    :class="[
      'progress-wrap',
      `progress-wrap--${size}`,
      `progress--${variant}`,
      { 'progress--indeterminate': indeterminate },
    ]"
  >
    <div v-if="label || showValue" class="progress-wrap__meta">
      <Progress.Label v-if="label" class="progress-wrap__label">{{
        label
      }}</Progress.Label>
      <Progress.Value
        v-if="showValue"
        v-slot="{ percent }"
        class="progress-wrap__value"
      >
        {{ Math.round(percent) }}%
      </Progress.Value>
    </div>
    <Progress.Track class="progress__track">
      <Progress.Fill class="progress__fill" />
    </Progress.Track>
  </Progress.Root>
</template>

<style scoped>
.progress-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-family: var(--font-family-base);
  width: 100%;
}

.progress-wrap__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.progress-wrap__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}
.progress-wrap__value {
  font-size: 12px;
  color: var(--color-text-muted);
}

.progress__track {
  width: 100%;
  background: var(--color-surface-muted);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-wrap--sm .progress__track {
  height: 4px;
}
.progress-wrap--md .progress__track {
  height: 8px;
}

.progress__fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}
.progress--success .progress__fill {
  background: var(--color-success);
}
.progress--warning .progress__fill {
  background: var(--color-warning);
}
.progress--error .progress__fill {
  background: var(--color-error);
}

.progress--indeterminate .progress__fill {
  width: 40% !important;
  animation: indeterminate 1.4s ease-in-out infinite;
}

@keyframes indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(350%);
  }
}
</style>
