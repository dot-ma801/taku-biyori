<script setup lang="ts">
import { computed } from 'vue';

type Rule = (value: string) => true | string;

const props = withDefaults(
  defineProps<{
    label?: string;
    placeholder?: string;
    hint?: string;
    rows?: number;
    rules?: Rule[];
    disabled?: boolean;
    readonly?: boolean;
    resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  }>(),
  {
    rows: 4,
    resize: 'vertical',
  },
);

const model = defineModel<string>({ default: '' });

const errors = computed(() => {
  if (!props.rules) return [];
  return props.rules
    .map((r) => r(model.value))
    .filter((r) => r !== true) as string[];
});
</script>

<template>
  <div class="textarea-wrap">
    <label v-if="label" class="textarea-wrap__label">{{ label }}</label>
    <textarea
      v-model="model"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :style="{ resize }"
      class="textarea-wrap__control"
      :class="{ 'textarea-wrap__control--error': errors.length > 0 }"
    />
    <span v-if="hint && errors.length === 0" class="textarea-wrap__hint">{{
      hint
    }}</span>
    <div v-if="errors.length > 0" class="textarea-wrap__errors">
      <span v-for="error in errors" :key="error" class="textarea-wrap__error">{{
        error
      }}</span>
    </div>
  </div>
</template>

<style scoped>
/* Same DS field chrome as BaseTextBox, with the textarea's 1.8 line-height. */
.textarea-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-family: var(--font-body);
}

.textarea-wrap__label {
  font: var(--text-label);
  color: var(--text-primary);
}

.textarea-wrap__control {
  display: block;
  padding: 10px 12px;
  font: var(--text-body-sm);
  line-height: 1.8;
  color: var(--text-primary);
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-control);
  transition: var(--transition-control);
  width: 100%;
  box-sizing: border-box;
  min-height: 80px;
}
.textarea-wrap__control::placeholder {
  color: var(--text-tertiary);
}
.textarea-wrap__control:hover:not(:disabled):not(:read-only) {
  border-color: var(--border-strong);
}
.textarea-wrap__control:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: var(--focus-ring);
}
.textarea-wrap__control:disabled {
  color: var(--text-disabled);
  background: var(--surface-subtle);
  border-color: var(--border-subtle);
  cursor: not-allowed;
}
.textarea-wrap__control--error {
  border-color: var(--error);
}

.textarea-wrap__hint {
  font: var(--text-caption);
  color: var(--text-secondary);
}

.textarea-wrap__errors {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.textarea-wrap__error {
  font: var(--text-caption);
  color: var(--error-text);
}
</style>
