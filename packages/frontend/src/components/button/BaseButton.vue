<script setup lang="ts">
import { computed } from 'vue';
import type { LucideIcon } from '@lucide/vue';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const ICON_SIZE: Record<Size, number> = {
  sm: 16,
  md: 18,
  lg: 20,
};

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    leftIcon?: LucideIcon;
    rightIcon?: LucideIcon;
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
  },
);

const iconSize = computed(() => ICON_SIZE[props.size]);
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-label="loading ? '読み込み中' : undefined"
    :class="[
      'btn',
      `btn--${variant}`,
      `btn--${size}`,
      { 'btn--loading': loading },
    ]"
  >
    <span v-if="loading" class="btn__spinner" aria-hidden="true" />
    <template v-else>
      <component
        :is="leftIcon"
        v-if="leftIcon"
        :size="iconSize"
        aria-hidden="true"
      />
      <slot />
      <component
        :is="rightIcon"
        v-if="rightIcon"
        :size="iconSize"
        aria-hidden="true"
      />
    </template>
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-control);
  border-width: var(--border-width);
  border-style: solid;
  border-color: transparent;
  cursor: pointer;
  transition: var(--transition-control);
  white-space: nowrap;
  user-select: none;
}
.btn:focus-visible {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: var(--focus-ring);
}

/* sizes — DS: sm 32 / md 40 / lg 48 */
.btn--sm {
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  font: var(--text-label);
}
.btn--md {
  gap: 8px;
  height: 40px;
  padding: 0 16px;
  font: var(--text-body-sm);
}
.btn--lg {
  gap: 8px;
  height: 48px;
  padding: 0 22px;
  font: var(--text-body);
}
/* `font` shorthand above resets the weight, so each variant restates it. */

/* primary */
.btn--primary {
  font-weight: var(--weight-semibold);
  background-color: var(--primary);
  color: var(--text-on-primary);
}
.btn--primary:hover:not(:disabled) {
  background-color: var(--primary-hover);
}
.btn--primary:active:not(:disabled) {
  background-color: var(--primary-active);
}

/* secondary */
.btn--secondary {
  font-weight: var(--weight-semibold);
  background-color: var(--surface);
  color: var(--primary-on-subtle);
  border-color: var(--border-strong);
}
.btn--secondary:hover:not(:disabled) {
  background-color: var(--primary-subtle);
  border-color: var(--primary);
}
.btn--secondary:active:not(:disabled) {
  background-color: var(--primary-subtle-hover);
}

/* ghost */
.btn--ghost {
  font-weight: var(--weight-medium);
  background-color: transparent;
  color: var(--text-secondary);
}
.btn--ghost:hover:not(:disabled) {
  background-color: var(--surface-subtle);
  color: var(--text-primary);
}
.btn--ghost:active:not(:disabled) {
  background-color: var(--border-subtle);
  color: var(--text-primary);
}

/* danger */
.btn--danger {
  font-weight: var(--weight-semibold);
  background-color: var(--error);
  color: #ffffff;
}
.btn--danger:hover:not(:disabled) {
  background-color: var(--error-700);
}
.btn--danger:active:not(:disabled) {
  background-color: var(--error-700);
}

/* disabled / loading — DS mutes the surface instead of fading the element */
.btn:disabled {
  background-color: var(--surface-subtle);
  color: var(--text-disabled);
  border-color: var(--border-subtle);
  cursor: not-allowed;
}
.btn--ghost:disabled {
  background-color: transparent;
  border-color: transparent;
}

/* loading spinner */
.btn__spinner {
  display: block;
  width: 1em;
  height: 1em;
  border: 2px solid color-mix(in oklab, currentColor 30%, transparent);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: btn-spin 0.7s linear infinite;
  flex: none;
}
@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
