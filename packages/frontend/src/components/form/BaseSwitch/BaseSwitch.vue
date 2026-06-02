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
        <Switch.Thumb class="switch__thumb" />
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

.switch__root {
  background: none;
  border: none;
  padding: 0;
  cursor: inherit;
}
.switch__root:focus-visible .switch__track {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.switch__track {
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
.switch__root[aria-checked='true'] .switch__track,
.switch__root[data-state='checked'] .switch__track {
  background: var(--color-primary);
}

.switch__thumb {
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
  transform: translateX(0);
  display: block;
  flex-shrink: 0;
}
.switch__root[aria-checked='true'] .switch__thumb,
.switch__root[data-state='checked'] .switch__thumb {
  transform: translateX(16px);
}

.switch__label {
  line-height: 1.4;
}
</style>
