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
        <Check :size="13" stroke-width="2.5" />
      </Checkbox.Indicator>
    </Checkbox.Root>
    <span v-if="label" class="checkbox__label">{{ label }}</span>
    <slot />
  </label>
</template>

<style scoped>
/* DS: an 18px box with a 1.5px border; checked fills with --primary, hover
   tints with --primary-subtle. */
.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font: var(--text-body-sm);
  color: var(--text-primary);
  user-select: none;
}
.checkbox--disabled {
  color: var(--text-disabled);
  cursor: not-allowed;
}

:deep(.checkbox__root) {
  appearance: none;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  background: var(--surface);
  border: var(--border-width-strong) solid var(--border-strong);
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: inherit;
  transition: var(--transition-control);
  padding: 0;
}
:deep(.checkbox__root[aria-checked='true']),
:deep(.checkbox__root[data-state='checked']) {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--text-on-primary);
}
:deep(.checkbox__root:focus-visible) {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: var(--focus-ring);
}
:deep(.checkbox__root:hover:not(:disabled)) {
  background: var(--primary-subtle);
}
:deep(.checkbox__root[aria-checked='true']:hover:not(:disabled)),
:deep(.checkbox__root[data-state='checked']:hover:not(:disabled)) {
  background: var(--primary);
}
:deep(.checkbox__root:disabled) {
  background: var(--surface-subtle);
  border-color: var(--border-subtle);
}

:deep(.checkbox__indicator) {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-on-primary);
}
</style>
