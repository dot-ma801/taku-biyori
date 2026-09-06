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
/* DS: a 40x22 pill track, --border-strong when off and --primary when on,
   with a 16px --ink-0 thumb that slides (never scales). */
.switch {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font: var(--text-body-sm);
  color: var(--text-primary);
  user-select: none;
}
.switch--disabled {
  color: var(--text-disabled);
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
  box-shadow: var(--focus-ring);
}

:deep(.switch__track) {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 40px;
  height: 22px;
  background: var(--border-strong);
  border-radius: var(--radius-full);
  transition: background-color var(--duration-normal) var(--ease-standard);
  padding: 3px;
  box-sizing: border-box;
}
:deep(.switch__root[aria-checked='true'] .switch__track),
:deep(.switch__root[data-state='checked'] .switch__track) {
  background: var(--primary);
}
.switch--disabled :deep(.switch__track) {
  background: var(--border-subtle);
}

:deep(.switch__thumb) {
  width: 16px;
  height: 16px;
  background: var(--ink-0);
  border-radius: 50%;
  transition: transform var(--duration-normal) var(--ease-out);
  transform: translateX(0);
  display: block;
  flex-shrink: 0;
  box-shadow: var(--shadow-xs);
}
:deep(.switch__root[aria-checked='true'] .switch__thumb),
:deep(.switch__root[data-state='checked'] .switch__thumb) {
  transform: translateX(18px);
}
</style>
