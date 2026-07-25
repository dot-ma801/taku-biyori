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
.textarea-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-family: var(--font-family-base);
}

.textarea-wrap__label {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--color-text-secondary);
}

.textarea-wrap__control {
  padding: 10px 12px;
  font-family: var(--font-family-base);
  font-size: 14px;
  line-height: 1.65;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  width: 100%;
  box-sizing: border-box;
  min-height: 80px;
}
.textarea-wrap__control::placeholder {
  color: var(--color-text-muted);
}
.textarea-wrap__control:hover:not(:disabled):not(:read-only) {
  border-color: var(--color-secondary);
}
.textarea-wrap__control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-soft);
}
.textarea-wrap__control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-surface-muted);
}
.textarea-wrap__control--error {
  border-color: var(--color-error);
}
.textarea-wrap__control--error:focus {
  box-shadow: 0 0 0 2px rgba(201, 79, 73, 0.15);
}

.textarea-wrap__hint {
  font-size: 12px;
  color: var(--color-text-muted);
}

.textarea-wrap__errors {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.textarea-wrap__error {
  font-size: 12px;
  color: var(--color-error);
}
</style>
