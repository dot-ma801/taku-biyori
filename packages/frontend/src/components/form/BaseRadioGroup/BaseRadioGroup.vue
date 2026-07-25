<script setup lang="ts">
import { Radio } from '@vuetify/v0';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

defineProps<{
  options: RadioOption[];
  label?: string;
  disabled?: boolean;
  direction?: 'row' | 'column';
}>();

const model = defineModel<string>();
</script>

<template>
  <fieldset class="radio-group" :disabled="disabled">
    <legend v-if="label" class="radio-group__legend">{{ label }}</legend>
    <Radio.Group
      v-model="model"
      :class="[
        'radio-group__list',
        direction === 'row' ? 'radio-group__list--row' : '',
      ]"
    >
      <label
        v-for="opt in options"
        :key="opt.value"
        :class="['radio', { 'radio--disabled': opt.disabled || disabled }]"
      >
        <!-- ラッパーで円形を表現（Radio.Root の inheritAttrs に依存しない） -->
        <span class="radio__circle">
          <Radio.Root :value="opt.value" :disabled="opt.disabled || disabled">
            <Radio.Indicator class="radio__indicator" />
          </Radio.Root>
        </span>
        <span class="radio__label">{{ opt.label }}</span>
      </label>
    </Radio.Group>
  </fieldset>
</template>

<style scoped>
.radio-group {
  border: none;
  padding: 0;
  margin: 0;
  font-family: var(--font-family-base);
}
.radio-group:disabled {
  opacity: 0.45;
}

.radio-group__legend {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.radio-group__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.radio-group__list--row {
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.radio {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text);
  font-family: var(--font-family-base);
  user-select: none;
}
.radio--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ネイティブ span で円形を表現 */
.radio__circle {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid var(--color-border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s;
  cursor: inherit;
}
/* checked 状態の子 button が data-state='checked' を持つとき円の枠色を変える */
.radio__circle:has([data-state='checked']) {
  border-color: var(--color-primary);
}

/* Radio.Root (button) のデフォルトスタイルをリセット */
.radio__circle :deep(button) {
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: inherit;
  border-radius: 50%;
}
.radio__circle :deep(button:focus-visible) {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
  border-radius: 50%;
}

.radio__indicator {
  width: 8px;
  height: 8px;
  background: var(--color-primary);
  border-radius: 50%;
  display: block;
}

.radio__label {
  line-height: 1.4;
}
</style>
