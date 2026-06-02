<script setup lang="ts">
import { Checkbox } from '@vuetify/v0';
import { Check } from '@lucide/vue';

defineProps<{
  label?: string;
  disabled?: boolean;
  value?: string;
}>();

const model = defineModel<boolean>({ default: false });
</script>

<template>
  <label :class="['checkbox', { 'checkbox--disabled': disabled }]">
    <Checkbox.Root
      v-model="model"
      :disabled="disabled"
      :value="value"
      class="checkbox__root"
    >
      <Checkbox.Indicator class="checkbox__indicator">
        <Check :size="12" stroke-width="3" />
      </Checkbox.Indicator>
    </Checkbox.Root>
    <span v-if="label" class="checkbox__label">{{ label }}</span>
    <slot />
  </label>
</template>

<style scoped>
.checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-family: var(--font-family-base);
  font-size: 14px;
  color: var(--color-text);
  user-select: none;
}
.checkbox--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.checkbox__root {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: inherit;
  transition:
    background-color 0.15s,
    border-color 0.15s;
  padding: 0;
}
.checkbox__root[aria-checked='true'],
.checkbox__root[data-state='checked'] {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-on-primary);
}
.checkbox__root:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.checkbox__root:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.checkbox__indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-on-primary);
}

.checkbox__label {
  line-height: 1.4;
}
</style>
