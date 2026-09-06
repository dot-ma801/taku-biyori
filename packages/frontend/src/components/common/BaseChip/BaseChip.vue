<script setup lang="ts">
import { computed } from 'vue';
import { X } from '@lucide/vue';

type Size = 'sm' | 'md' | 'lg';

const ICON_SIZE: Record<Size, number> = {
  sm: 12,
  md: 13,
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
/* DS: chips get the pill (badges stay rectangular). Selection is carried by
   --primary-subtle + a --primary border, never by a filled brand colour. */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font: var(--text-label);
  border-radius: var(--radius-full);
  border-width: var(--border-width);
  border-style: solid;
  cursor: pointer;
  transition: var(--transition-control);
  user-select: none;
  white-space: nowrap;
}
.chip:focus-visible {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: var(--focus-ring);
}

/* sizes — DS: sm 26 / md 32, lg is this project's own step up */
.chip--sm {
  height: 26px;
  padding: 0 10px;
  font: var(--text-caption);
}
.chip--md {
  height: 32px;
  padding: 0 13px;
}
.chip--lg {
  height: 38px;
  padding: 0 16px;
  font: var(--text-body-sm);
}

.chip--selected {
  background-color: var(--primary-subtle);
  color: var(--primary-on-subtle);
  border-color: var(--primary);
}
.chip--selected:hover:not(.chip--disabled) {
  background-color: var(--primary-subtle-hover);
}

.chip--unselected {
  background-color: var(--surface);
  color: var(--text-secondary);
  border-color: var(--border);
}
.chip--unselected:hover:not(.chip--disabled) {
  background-color: var(--surface-subtle);
  border-color: var(--border-strong);
}

.chip--disabled {
  background-color: var(--surface-subtle);
  color: var(--text-disabled);
  border-color: var(--border-subtle);
  cursor: not-allowed;
}

.chip__remove {
  display: inline-flex;
  align-items: center;
  margin-right: -3px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  transition: opacity var(--duration-fast) var(--ease-standard);
}
.chip__remove:hover {
  opacity: 1;
}
</style>
