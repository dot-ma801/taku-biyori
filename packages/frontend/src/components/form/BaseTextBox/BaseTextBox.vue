<script setup lang="ts">
import { Input } from '@vuetify/v0';

type Rule = (value: unknown) => true | string;

withDefaults(
  defineProps<{
    label?: string;
    placeholder?: string;
    hint?: string;
    type?: string;
    autocomplete?: string;
    rules?: Rule[];
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    min?: string | number;
    max?: string | number;
    step?: string | number;
  }>(),
  {
    type: 'text',
  },
);

const model = defineModel<string>({ default: '' });
</script>

<template>
  <Input.Root
    v-model="model"
    :label="label"
    :type="type"
    :rules="rules"
    :disabled="disabled"
    :readonly="readonly"
    :required="required"
    class="textbox"
    validate-on="blur"
  >
    <label v-if="label" class="textbox__label">
      {{ label }}<span v-if="required" class="textbox__required">*</span>
    </label>
    <Input.Control
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :min="min"
      :max="max"
      :step="step"
      class="textbox__control"
    />
    <Input.Description v-if="hint" class="textbox__hint">
      {{ hint }}
    </Input.Description>
    <Input.Error v-slot="{ errors }" class="textbox__errors">
      <span v-for="error in errors" :key="error" class="textbox__error">{{
        error
      }}</span>
    </Input.Error>
  </Input.Root>
</template>

<style scoped>
/* DS field chrome: --surface inside a --border hairline, --border-strong on
   hover, --border-focus + --focus-ring on focus. */
.textbox {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-family: var(--font-body);
}

.textbox__label {
  font: var(--text-label);
  color: var(--text-primary);
}

.textbox__required {
  color: var(--error);
  margin-left: 2px;
}

.textbox__control {
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
.textbox__control::placeholder {
  color: var(--text-tertiary);
}
.textbox__control:hover:not(:disabled):not(:read-only) {
  border-color: var(--border-strong);
}
.textbox__control:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: var(--focus-ring);
}
.textbox__control:disabled {
  color: var(--text-disabled);
  background: var(--surface-subtle);
  border-color: var(--border-subtle);
  cursor: not-allowed;
}
.textbox__control[aria-invalid='true'] {
  border-color: var(--error);
}

.textbox__hint {
  font: var(--text-caption);
  color: var(--text-secondary);
}

.textbox__errors {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.textbox__error {
  font: var(--text-caption);
  color: var(--error-text);
}
</style>
