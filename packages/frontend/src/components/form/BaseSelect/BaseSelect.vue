<script setup lang="ts">
import { Select } from '@vuetify/v0'
import { ChevronDown, Check } from '@lucide/vue'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

const props = defineProps<{
  options: SelectOption[]
  placeholder?: string
  label?: string
  disabled?: boolean
}>()

const model = defineModel<string>()
</script>

<template>
  <div class="select-wrap">
    <span v-if="label" class="select-wrap__label">{{ label }}</span>
    <Select.Root v-model="model" :disabled="disabled" class="select">
      <Select.Activator class="select__activator">
        <Select.Value v-slot="{ selectedValue }" class="select__value">
          {{ options.find(o => o.value === selectedValue)?.label ?? selectedValue }}
        </Select.Value>
        <Select.Placeholder class="select__placeholder">
          {{ placeholder ?? '選択してください' }}
        </Select.Placeholder>
        <Select.Cue v-slot="{ isOpen }" class="select__cue">
          <ChevronDown :size="14" :style="{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }" />
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
          <div v-bind="attrs" class="select__item" :class="{ 'select__item--selected': isSelected, 'select__item--disabled': opt.disabled }">
            <span>{{ opt.label }}</span>
            <Check v-if="isSelected" :size="13" class="select__item-check" />
          </div>
        </Select.Item>
      </Select.Content>
    </Select.Root>
  </div>
</template>

<style scoped>
.select-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-family: var(--font-family-base);
}

.select-wrap__label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--color-text-secondary);
}

.select {
  position: relative;
}

.select__activator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: 10px 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-base);
  font-size: 14px;
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.select__activator:hover:not(:disabled) {
  border-color: var(--color-secondary);
}
.select__activator[aria-expanded='true'] {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-soft);
}
.select__activator:focus-visible {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-soft);
}
.select__activator:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-surface-muted);
}

.select__value {
  flex: 1;
  text-align: left;
}
.select__placeholder {
  flex: 1;
  color: var(--color-text-muted);
  text-align: left;
}
.select__cue {
  flex-shrink: 0;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
}

/* Select.Content は native popover + CSS anchor positioning で自動配置される */
.select__content {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  padding: var(--space-1) 0;
  max-height: 240px;
  overflow-y: auto;
  min-width: anchor-size(width);
}

.select__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--color-text);
  cursor: pointer;
  transition: background-color 0.1s;
}
.select__item:hover:not(.select__item--disabled) {
  background: var(--color-surface-raised);
}
.select__item--selected {
  color: var(--color-primary-text);
  font-weight: 600;
}
.select__item--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.select__item-check {
  color: var(--color-primary-text);
  flex-shrink: 0;
}
</style>
