<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { CheckCircle, Info, AlertTriangle, AlertCircle, X } from '@lucide/vue'

const { toasts, dismiss } = useToast()

const iconMap = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-stack" aria-live="polite" aria-atomic="false">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', `toast--${toast.variant}`]"
          role="status"
        >
          <component :is="iconMap[toast.variant]" :size="16" class="toast__icon" aria-hidden="true" />
          <span class="toast__message">{{ toast.message }}</span>
          <button class="toast__close" aria-label="閉じる" @click="dismiss(toast.id)">
            <X :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  bottom: var(--space-5);
  right: var(--space-5);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  font-family: var(--font-family-base);
  font-size: 13px;
  line-height: 1.4;
  min-width: 240px;
  max-width: 360px;
  box-shadow: var(--shadow-md);
  pointer-events: auto;
}

.toast--info {
  background: var(--color-surface);
  border-color: var(--color-border-strong);
  color: var(--color-text);
}
.toast--info .toast__icon { color: var(--color-primary-text); }

.toast--success {
  background: color-mix(in srgb, var(--color-success) 12%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-success) 30%, var(--color-border));
  color: var(--color-text);
}
.toast--success .toast__icon { color: var(--color-success); }

.toast--warning {
  background: color-mix(in srgb, var(--color-warning) 12%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-warning) 30%, var(--color-border));
  color: var(--color-text);
}
.toast--warning .toast__icon { color: var(--color-warning); }

.toast--error {
  background: color-mix(in srgb, var(--color-error) 12%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-error) 30%, var(--color-border));
  color: var(--color-text);
}
.toast--error .toast__icon { color: var(--color-error); }

.toast__icon { flex-shrink: 0; }
.toast__message { flex: 1; }

.toast__close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  padding: 2px;
  display: flex;
  align-items: center;
  border-radius: var(--radius-sm);
  transition: opacity 0.15s;
}
.toast__close:hover { opacity: 1; }

/* transitions */
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>
