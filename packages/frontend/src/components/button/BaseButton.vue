<script setup lang="ts">
import { computed } from 'vue';
import type { LucideIcon } from '@lucide/vue';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'text';
type Size = 'sm' | 'md' | 'lg';

const ICON_SIZE: Record<Size, number> = {
  sm: 14,
  md: 16,
  lg: 18,
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
  gap: var(--space-2);
  font-family:
    'Zen Kaku Gothic New', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-normal);
  line-height: 1.2;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard),
    opacity var(--duration-fast) var(--ease-standard);
  white-space: nowrap;
  user-select: none;
}
.btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* sizes */
.btn--sm {
  padding: 8px 14px;
  font-size: var(--text-xs);
}
.btn--md {
  padding: 11px 20px;
  font-size: var(--text-sm);
}
.btn--lg {
  padding: 14px 26px;
  font-size: var(--text-base);
}

/* primary */
.btn--primary {
  background-color: var(--brand-primary);
  color: var(--text-inverse);
  border-color: var(--brand-primary);
}
.btn--primary:hover:not(:disabled) {
  background-color: var(--brand-primary-hover);
  border-color: var(--brand-primary-hover);
}
.btn--primary:active:not(:disabled) {
  background-color: var(--brand-primary-press);
  border-color: var(--brand-primary-press);
  transform: scale(0.98);
}

/* secondary — sora blue soft */
.btn--secondary {
  background-color: var(--brand-secondary-soft);
  color: var(--brand-secondary-press);
  border-color: var(--brand-secondary-border);
}
.btn--secondary:hover:not(:disabled) {
  background-color: var(--brand-secondary);
  color: var(--text-inverse);
  border-color: var(--brand-secondary);
}
.btn--secondary:active:not(:disabled) {
  background-color: var(--brand-secondary-press);
  border-color: var(--brand-secondary-press);
  color: var(--text-inverse);
  transform: scale(0.98);
}

/* ghost — transparent + border-default */
.btn--ghost {
  background-color: transparent;
  color: var(--text-primary);
  border-color: var(--border-default);
}
.btn--ghost:hover:not(:disabled) {
  background-color: var(--surface-card-sunk);
  border-color: var(--border-strong);
}
.btn--ghost:active:not(:disabled) {
  background-color: var(--washi-100);
  transform: scale(0.98);
}

/* text — no chrome, brand-primary color */
.btn--text {
  background-color: transparent;
  color: var(--brand-primary);
  border-color: transparent;
  padding-left: var(--space-2);
  padding-right: var(--space-2);
}
.btn--text:hover:not(:disabled) {
  color: var(--brand-primary-hover);
  background-color: var(--brand-primary-soft);
}
.btn--text:active:not(:disabled) {
  color: var(--brand-primary-press);
  transform: scale(0.98);
}

/* danger */
.btn--danger {
  background-color: var(--state-danger);
  color: var(--text-inverse);
  border-color: var(--state-danger);
}
.btn--danger:hover:not(:disabled) {
  background-color: var(--coral-600);
  border-color: var(--coral-600);
}
.btn--danger:active:not(:disabled) {
  background-color: var(--coral-600);
  border-color: var(--coral-600);
  transform: scale(0.98);
  opacity: 0.9;
}

/* disabled / loading */
.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* loading spinner */
.btn__spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: btn-spin 0.6s linear infinite;
  flex-shrink: 0;
}
@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
