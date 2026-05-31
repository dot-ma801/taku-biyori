<script setup lang="ts">
import { X } from '@lucide/vue'

const props = withDefaults(defineProps<{
  selected?: boolean
  removable?: boolean
  disabled?: boolean
}>(), {})

const emit = defineEmits<{
  'update:selected': [value: boolean]
  remove: []
}>()

const toggle = () => {
  if (!props.disabled) {
    emit('update:selected', !props.selected)
  }
}
</script>

<template>
  <span
    :class="['chip', selected ? 'chip--selected' : 'chip--unselected', { 'chip--disabled': disabled }]"
    :aria-pressed="selected"
    role="button"
    :tabindex="disabled ? -1 : 0"
    @click="toggle"
    @keydown.enter.space.prevent="toggle"
  >
    <slot />
    <button
      v-if="removable"
      class="chip__remove"
      aria-label="削除"
      @click.stop="emit('remove')"
      @keydown.enter.space.prevent.stop="emit('remove')"
    >
      <X :size="12" />
    </button>
  </span>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 5px 10px;
  font-family: var(--font-family-base);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.2;
  border-radius: var(--radius-full);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;
  user-select: none;
  white-space: nowrap;
}
.chip:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.chip--selected {
  background-color: color-mix(in srgb, var(--color-primary) 15%, var(--color-surface));
  color: var(--color-text);
  border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
}

.chip--unselected {
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
  border-color: var(--color-border-strong);
}
.chip--unselected:hover:not(.chip--disabled) {
  background-color: var(--color-surface-raised);
  color: var(--color-text);
}

.chip--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.chip__remove {
  display: inline-flex;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.15s;
}
.chip__remove:hover {
  opacity: 1;
}
</style>
