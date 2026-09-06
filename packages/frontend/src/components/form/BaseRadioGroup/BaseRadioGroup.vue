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
/* DS: an 18px circle with a 1.5px border; checked switches the ring and the
   dot to --primary, hover tints the well with --primary-subtle. */
.radio-group {
  border: none;
  padding: 0;
  margin: 0;
  font-family: var(--font-body);
}

.radio-group__legend {
  font: var(--text-label);
  color: var(--text-primary);
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
  gap: 10px;
  cursor: pointer;
  font: var(--text-body-sm);
  color: var(--text-primary);
  user-select: none;
}
.radio--disabled {
  color: var(--text-disabled);
  cursor: not-allowed;
}

/* ネイティブ span で円形を表現 */
.radio__circle {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--surface);
  border: var(--border-width-strong) solid var(--border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-control);
  cursor: inherit;
}
.radio:hover:not(.radio--disabled) .radio__circle {
  background: var(--primary-subtle);
}
/* checked 状態の子 button が data-state='checked' を持つとき円の枠色を変える */
.radio__circle:has([data-state='checked']) {
  background: var(--surface);
  border-color: var(--primary);
}
.radio--disabled .radio__circle {
  background: var(--surface-subtle);
  border-color: var(--border-subtle);
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
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: 50%;
}

.radio__indicator {
  width: 8px;
  height: 8px;
  background: var(--primary);
  border-radius: 50%;
  display: block;
}
.radio--disabled .radio__indicator {
  background: var(--text-disabled);
}
</style>
