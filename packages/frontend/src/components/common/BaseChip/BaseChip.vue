<script setup lang="ts">
import { computed } from 'vue';
import { X } from '@lucide/vue';

type Size = 'sm' | 'md' | 'lg';

const ICON_SIZE: Record<Size, number> = {
  sm: 10,
  md: 12,
  lg: 14,
};

const props = withDefaults(
  defineProps<{
    selected?: boolean;
    removable?: boolean;
    disabled?: boolean;
    size?: Size;
  }>(),
  {
    size: 'md',
  },
);

const emit = defineEmits<{
  'update:selected': [value: boolean];
  remove: [];
}>();

const toggle = () => {
  if (!props.disabled) {
    emit('update:selected', !props.selected);
  }
};

const removeIconSize = computed(() => ICON_SIZE[props.size]);
</script>

<template>
  <span
    :class="[
      'chip',
      `chip--${size}`,
      selected ? 'chip--selected' : 'chip--unselected',
      { 'chip--disabled': disabled },
    ]"
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
      <X :size="removeIconSize" />
    </button>
  </span>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-family:
    'Zen Kaku Gothic New', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-normal);
  line-height: 1.2;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard);
  user-select: none;
  white-space: nowrap;
}
.chip:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* sizes — chips are slightly larger than badges */
.chip--sm {
  padding: 4px 10px;
  font-size: var(--text-2xs);
}
.chip--md {
  padding: 6px 12px;
  font-size: var(--text-xs);
}
.chip--lg {
  padding: 8px 16px;
  font-size: var(--text-sm);
}

.chip--selected {
  background-color: var(--brand-primary-soft);
  color: var(--brand-primary-press);
  border-color: var(--brand-primary-border);
}

.chip--unselected {
  background-color: var(--surface-card);
  color: var(--text-secondary);
  border-color: var(--border-default);
}
.chip--unselected:hover:not(.chip--disabled) {
  background-color: var(--surface-card-sunk);
  color: var(--text-primary);
  border-color: var(--border-strong);
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
  transition: opacity var(--duration-fast) var(--ease-standard);
}
.chip__remove:hover {
  opacity: 1;
}
</style>
