<script setup lang="ts">
import { useToast } from '@/composables/useToast';
import { CheckCircle, Info, AlertTriangle, AlertCircle, X } from '@lucide/vue';

const { toasts, dismiss } = useToast();

const iconMap = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};
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
          <component
            :is="iconMap[toast.variant]"
            :size="19"
            class="toast__icon"
            aria-hidden="true"
          />
          <span class="toast__message">{{ toast.message }}</span>
          <button
            class="toast__close"
            aria-label="閉じる"
            @click="dismiss(toast.id)"
          >
            <X :size="16" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  pointer-events: none;
}

/* DS: the toast surface itself is neutral (--surface-raised) in every tone —
   only the icon carries the tone colour. */
.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--surface-raised);
  color: var(--text-primary);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font: var(--text-body-sm);
  min-width: 280px;
  max-width: 400px;
  pointer-events: auto;
}

.toast--info .toast__icon {
  color: var(--info);
}
.toast--success .toast__icon {
  color: var(--success);
}
.toast--warning .toast__icon {
  color: var(--warning);
}
.toast--error .toast__icon {
  color: var(--error);
}

.toast__icon {
  flex-shrink: 0;
  margin-top: 2px;
}
.toast__message {
  flex: 1;
  min-width: 0;
  font-weight: var(--weight-medium);
}

.toast__close {
  flex-shrink: 0;
  margin: -4px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: var(--radius-sm);
  transition: var(--transition-control);
}
.toast__close:hover {
  color: var(--text-primary);
  background: var(--surface-subtle);
}
.toast__close:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* transitions — DS: a short rise, no bounce, no scale */
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--duration-normal) var(--ease-out),
    transform var(--duration-normal) var(--ease-out);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
