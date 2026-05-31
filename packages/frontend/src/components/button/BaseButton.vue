<script setup lang="ts">
type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md'

withDefaults(defineProps<{
  variant?: Variant
  size?: Size
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :class="['btn', `btn--${variant}`, `btn--${size}`, { 'btn--loading': loading }]"
  >
    <span v-if="loading" class="btn__spinner" aria-hidden="true" />
    <slot v-else />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-family-base);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.2;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s;
  white-space: nowrap;
  user-select: none;
}
.btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* sizes */
.btn--sm { padding: 6px 12px; font-size: 12px; }
.btn--md { padding: 10px 16px; }

/* primary */
.btn--primary {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  border-color: var(--color-primary);
}
.btn--primary:hover:not(:disabled) {
  background-color: var(--color-primary-strong);
  border-color: var(--color-primary-strong);
}

/* secondary */
.btn--secondary {
  background-color: var(--color-surface);
  color: var(--color-text);
  border-color: var(--color-border-strong);
}
.btn--secondary:hover:not(:disabled) {
  background-color: var(--color-surface-raised);
}

/* ghost */
.btn--ghost {
  background-color: transparent;
  color: var(--color-text-secondary);
  border-color: transparent;
}
.btn--ghost:hover:not(:disabled) {
  background-color: var(--color-surface-raised);
  color: var(--color-text);
}

/* active (push) */
.btn--primary:active:not(:disabled) {
  background-color: var(--color-primary-strong);
  border-color: var(--color-primary-strong);
  opacity: 0.8;
}
.btn--secondary:active:not(:disabled) {
  background-color: var(--color-surface-muted);
}
.btn--ghost:active:not(:disabled) {
  background-color: var(--color-surface-muted);
  color: var(--color-text);
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
  to { transform: rotate(360deg); }
}
</style>
