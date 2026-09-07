<script setup lang="ts">
import { Select } from '@vuetify/v0';
import { ChevronDown, Check } from '@lucide/vue';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

defineProps<{
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}>();

const model = defineModel<string>();
</script>

<template>
  <div class="select-wrap">
    <span v-if="label" class="select-wrap__label">{{ label }}</span>
    <Select.Root v-model="model" :disabled="disabled" class="select">
      <Select.Activator class="select__activator">
        <Select.Value v-slot="{ selectedValue }" class="select__value">
          {{
            options.find((o) => o.value === selectedValue)?.label ??
            selectedValue
          }}
        </Select.Value>
        <Select.Placeholder class="select__placeholder">
          {{ placeholder ?? '選択してください' }}
        </Select.Placeholder>
        <Select.Cue v-slot="{ isOpen }" class="select__cue">
          <ChevronDown
            :size="16"
            :style="{
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform var(--duration-fast) var(--ease-standard)',
            }"
          />
        </Select.Cue>
      </Select.Activator>

      <Select.Content class="select__content">
        <Select.Item
          v-for="opt in options"
          :key="opt.value"
          :id="opt.value"
          :value="opt.value"
          :disabled="opt.disabled"
          v-slot="{ isSelected, attrs }"
        >
          <div
            v-bind="attrs"
            class="select__item"
            :class="{
              'select__item--selected': isSelected,
              'select__item--disabled': opt.disabled,
            }"
          >
            <span>{{ opt.label }}</span>
            <Check v-if="isSelected" :size="16" class="select__item-check" />
          </div>
        </Select.Item>
      </Select.Content>
    </Select.Root>
  </div>
</template>

<style scoped>
/* Same DS field chrome as BaseTextBox; the popover is a --radius-md sheet on
   --surface-raised with --shadow-md. */
.select-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-family: var(--font-body);
}

.select-wrap__label {
  font: var(--text-label);
  color: var(--text-primary);
}

.select {
  position: relative;
}

.select__activator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  height: 40px;
  padding: 0 12px;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-control);
  font: var(--text-body-sm);
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  transition: var(--transition-control);
}
.select__activator:hover:not(:disabled) {
  border-color: var(--border-strong);
}
.select__activator[aria-expanded='true'],
.select__activator:focus-visible {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: var(--focus-ring);
}
.select__activator:disabled {
  color: var(--text-disabled);
  background: var(--surface-subtle);
  border-color: var(--border-subtle);
  cursor: not-allowed;
}

.select__value {
  flex: 1;
  min-width: 0;
  text-align: left;
}
.select__placeholder {
  flex: 1;
  min-width: 0;
  color: var(--text-tertiary);
  text-align: left;
}
.select__cue {
  flex-shrink: 0;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
}

/* Select.Content は native popover + CSS anchor positioning で自動配置される */
.select__content {
  background: var(--surface-raised);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--space-1);
  max-height: 240px;
  overflow-y: auto;
  min-width: anchor-size(width);
}

.select__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  height: 40px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  font: var(--text-body-sm);
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-control);
}
.select__item:hover:not(.select__item--disabled) {
  background: var(--surface-subtle);
}
.select__item--selected {
  background: var(--primary-subtle);
  color: var(--primary-on-subtle);
  font-weight: var(--weight-medium);
}
.select__item--disabled {
  color: var(--text-disabled);
  cursor: not-allowed;
}
.select__item-check {
  color: var(--primary);
  flex-shrink: 0;
}
</style>
