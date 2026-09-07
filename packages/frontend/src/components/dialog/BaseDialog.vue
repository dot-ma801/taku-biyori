<script setup lang="ts">
import { Dialog } from '@vuetify/v0';

defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <Dialog.Root>
    <Dialog.Activator v-if="$slots.activator" as-child>
      <slot name="activator" />
    </Dialog.Activator>

    <Dialog.Content class="dialog">
      <div class="dialog__header">
        <Dialog.Title class="dialog__title">{{ title }}</Dialog.Title>
        <Dialog.Close class="dialog__close" aria-label="閉じる">
          <span aria-hidden="true">✕</span>
        </Dialog.Close>
      </div>

      <Dialog.Description v-if="description" class="dialog__description">
        {{ description }}
      </Dialog.Description>

      <div class="dialog__body">
        <slot />
      </div>

      <!-- actions slot: Dialog.Close を div としてレンダリングし、領域内クリックで自動クローズ -->
      <Dialog.Close v-if="$slots.actions" as="div" class="dialog__actions">
        <slot name="actions" />
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Root>
</template>

<style scoped>
/* DS sheet: --radius-sheet, a hairline --border-subtle and --shadow-lg over
   the navy --overlay. */
.dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(520px, calc(100vw - 32px));
  max-height: calc(100vh - 64px);
  overflow-y: auto;
  background: var(--surface);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius-sheet);
  box-shadow: var(--shadow-lg);
  padding: var(--space-5);
  font-family: var(--font-body);
  color: var(--text-primary);
  animation: dialog-rise var(--duration-normal) var(--ease-out);
}

@keyframes dialog-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.dialog::backdrop {
  background: var(--overlay);
}

.dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.dialog__title {
  font: var(--text-h3);
  margin: 0;
  color: var(--text-primary);
}

.dialog__close {
  flex-shrink: 0;
  margin: -6px;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  line-height: 1;
  font-size: var(--size-body-sm);
  transition: var(--transition-control);
}
.dialog__close:hover {
  color: var(--text-primary);
  background-color: var(--surface-subtle);
}
.dialog__close:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.dialog__description {
  font: var(--text-body-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--space-4);
}

.dialog__body {
  font: var(--text-body-sm);
  color: var(--text-primary);
}

.dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-6);
}
</style>
