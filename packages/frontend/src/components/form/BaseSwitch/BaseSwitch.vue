<script setup lang="ts">
import { Switch } from '@vuetify/v0';

defineProps<{
  label?: string;
  disabled?: boolean;
}>();

const model = defineModel<boolean>({ default: false });
</script>

<template>
  <label :class="['switch', { 'switch--disabled': disabled }]">
    <Switch.Root v-model="model" :disabled="disabled" class="switch__root">
      <Switch.Track class="switch__track">
        <span class="switch__thumb" />
      </Switch.Track>
    </Switch.Root>
    <span v-if="label" class="switch__label">{{ label }}</span>
    <slot />
  </label>
</template>

<style scoped>
.switch {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-family: var(--font-family-base);
  font-size: 14px;
  color: var(--color-text);
  user-select: none;
}
.switch--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

:deep(.switch__root) {
  appearance: none;
  background: none;
  border: none;
  outline: none;
  padding: 0;
  cursor: inherit;
}
:deep(.switch__root:focus-visible .switch__track) {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

:deep(.switch__track) {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 36px;
  height: 20px;
  background: var(--color-border-strong);
  border-radius: var(--radius-full);
  transition: background-color 0.2s;
  padding: 2px;
  box-sizing: border-box;
}
:deep(.switch__root[aria-checked='true'] .switch__track),
:deep(.switch__root[data-state='checked'] .switch__track) {
  background: var(--color-primary);
}

:deep(.switch__thumb) {
  width: 16px;
  height: 16px;
  background: var(--color-on-primary);
  border-radius: 50%;
  transition: transform 0.2s;
  transform: translateX(0);
  display: block;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}
:deep(.switch__root[aria-checked='true'] .switch__thumb),
:deep(.switch__root[data-state='checked'] .switch__thumb) {
  transform: translateX(16px);
}

.switch__label {
  line-height: 1.4;
}
</style>
