<script setup lang="ts">
import { computed } from 'vue';
import { Check } from '@lucide/vue';

type StepStatus = 'completed' | 'active' | 'upcoming';

const props = withDefaults(
  defineProps<{
    steps: readonly string[];
    current: number;
    label?: string;
  }>(),
  {
    label: 'ステップ',
  },
);

const stepsView = computed<{ label: string; status: StepStatus }[]>(() =>
  props.steps.map((label, index) => {
    const stepNumber = index + 1;
    const status: StepStatus =
      stepNumber < props.current
        ? 'completed'
        : stepNumber === props.current
          ? 'active'
          : 'upcoming';
    return { label, status };
  }),
);

const currentLabel = computed(() => props.steps[props.current - 1] ?? '');
const liveText = computed(
  () => `ステップ${props.current}/${props.steps.length}: ${currentLabel.value}`,
);
</script>

<template>
  <ol class="stepper" :aria-label="label">
    <li
      v-for="(s, index) in stepsView"
      :key="index"
      :class="['stepper__item', `stepper__item--${s.status}`]"
      :aria-current="s.status === 'active' ? 'step' : undefined"
    >
      <span class="stepper__circle" aria-hidden="true">
        <Check v-if="s.status === 'completed'" :size="14" stroke-width="3" />
        <span v-else>{{ index + 1 }}</span>
      </span>
      <span class="stepper__label">
        {{ s.label }}
        <span v-if="s.status === 'completed'" class="visually-hidden">
          （完了）
        </span>
      </span>
    </li>
  </ol>
  <div class="visually-hidden" aria-live="polite">{{ liveText }}</div>
</template>

<style scoped>
.stepper {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  font-family: var(--font-family-base);
}

.stepper__item {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  text-align: center;
}

.stepper__item:not(:first-child)::before {
  content: '';
  position: absolute;
  top: 13px;
  right: 50%;
  width: 100%;
  height: 2px;
  background: var(--color-border);
}

.stepper__item--active:not(:first-child)::before,
.stepper__item--completed:not(:first-child)::before {
  background: var(--color-primary);
}

.stepper__circle {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 700;
}

.stepper__item--active .stepper__circle,
.stepper__item--completed .stepper__circle {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.stepper__label {
  font-size: 11px;
  color: var(--color-text-muted);
}

.stepper__item--active .stepper__label {
  color: var(--color-text);
  font-weight: 700;
}

.stepper__item--completed .stepper__label {
  color: var(--color-text-secondary);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
