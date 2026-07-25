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
.datetimepicker {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-family: var(--font-family-base);
}

.datetimepicker__label {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--color-text-secondary);
}

.datetimepicker__control {
  padding: 10px 12px;
  font-family: var(--font-family-base);
  font-size: 14px;
  line-height: 1.55;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.datetimepicker__control:hover:not(:disabled):not(:read-only) {
  border-color: var(--color-secondary);
}
.datetimepicker__control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-soft);
}
.datetimepicker__control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-surface-muted);
}

.datetimepicker__hint {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.45;
}

.datetimepicker__errors {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.datetimepicker__error {
  font-size: 12px;
  color: var(--color-error);
  line-height: 1.45;
}
</style>
