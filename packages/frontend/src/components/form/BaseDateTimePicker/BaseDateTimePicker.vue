<script setup lang="ts">
import { Input } from '@vuetify/v0';

type Rule = (value: unknown) => true | string;

withDefaults(
  defineProps<{
    label?: string;
    placeholder?: string;
    hint?: string;
    rules?: Rule[];
    disabled?: boolean;
    readonly?: boolean;
    min?: string;
    max?: string;
  }>(),
  {},
);

const model = defineModel<string>({ default: '' });
</script>

<template>
  <Input.Root
    v-model="model"
    :label="label"
    type="datetime-local"
    :rules="rules"
    :disabled="disabled"
    :readonly="readonly"
    class="datetimepicker"
    validate-on="blur"
  >
    <label v-if="label" class="datetimepicker__label">{{ label }}</label>
    <Input.Control
      :min="min"
      :max="max"
      :placeholder="placeholder"
      class="datetimepicker__control"
    />
    <Input.Description v-if="hint" class="datetimepicker__hint">
      {{ hint }}
    </Input.Description>
    <Input.Error v-slot="{ errors }" class="datetimepicker__errors">
      <span
        v-for="error in errors"
        :key="error"
        class="datetimepicker__error"
        >{{ error }}</span
      >
    </Input.Error>
  </Input.Root>
</template>

<style scoped>
/* Same DS field chrome as BaseTextBox. */
.datetimepicker {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-family: var(--font-body);
}

.datetimepicker__label {
  font: var(--text-label);
  color: var(--text-primary);
}

.datetimepicker__control {
  height: 40px;
  padding: 0 12px;
  font: var(--text-body-sm);
  color: var(--text-primary);
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-control);
  transition: var(--transition-control);
  width: 100%;
  box-sizing: border-box;
}
.datetimepicker__control:hover:not(:disabled):not(:read-only) {
  border-color: var(--border-strong);
}
.datetimepicker__control:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: var(--focus-ring);
}
.datetimepicker__control:disabled {
  color: var(--text-disabled);
  background: var(--surface-subtle);
  border-color: var(--border-subtle);
  cursor: not-allowed;
}

.datetimepicker__hint {
  font: var(--text-caption);
  color: var(--text-secondary);
}

.datetimepicker__errors {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.datetimepicker__error {
  font: var(--text-caption);
  color: var(--error-text);
}
</style>
