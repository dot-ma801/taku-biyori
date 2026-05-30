<script setup lang="ts">
import { Input } from '@vuetify/v0'

type Rule = (value: string) => true | string

withDefaults(defineProps<{
  label?: string
  placeholder?: string
  hint?: string
  type?: string
  rules?: Rule[]
  disabled?: boolean
  readonly?: boolean
}>(), {
  type: 'text',
})

const model = defineModel<string>({ default: '' })
</script>

<template>
  <Input.Root
    v-model="model"
    :label="label"
    :rules="rules"
    :disabled="disabled"
    :readonly="readonly"
    class="textbox"
    validate-on="blur"
  >
    <label v-if="label" class="textbox__label">{{ label }}</label>
    <Input.Control
      :type="type"
      :placeholder="placeholder"
      class="textbox__control"
    />
    <Input.Description v-if="hint" class="textbox__hint">
      {{ hint }}
    </Input.Description>
    <Input.Error v-slot="{ errors }" class="textbox__errors">
      <span
        v-for="error in errors"
        :key="error"
        class="textbox__error"
      >{{ error }}</span>
    </Input.Error>
  </Input.Root>
</template>

<style scoped>
.textbox {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-family: var(--font-family-base);
}

.textbox__label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--color-text-secondary);
}

.textbox__control {
  padding: 10px 12px;
  font-family: var(--font-family-base);
  font-size: 14px;
  line-height: 1.55;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.textbox__control::placeholder {
  color: var(--color-text-muted);
}
.textbox__control:hover:not(:disabled):not(:read-only) {
  border-color: var(--color-secondary);
}
.textbox__control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-soft);
}
.textbox__control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-surface-muted);
}

.textbox__hint {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.45;
}

.textbox__errors {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.textbox__error {
  font-size: 12px;
  color: var(--color-error);
  line-height: 1.45;
}
</style>
