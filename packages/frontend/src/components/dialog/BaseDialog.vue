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
.dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(480px, calc(100vw - 32px));
  max-height: calc(100vh - 64px);
  overflow-y: auto;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-6);
  font-family:
    'Zen Kaku Gothic New', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
  color: var(--text-primary);
}

.dialog::backdrop {
  background: var(--surface-overlay);
  backdrop-filter: blur(4px);
}

.dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.dialog__title {
  font-family:
    'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', 'Rounded Mplus 1c',
    sans-serif;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-snug);
  margin: 0;
  color: var(--text-primary);
}

.dialog__close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  line-height: 1;
  font-size: var(--text-sm);
  transition:
    color var(--duration-fast) var(--ease-standard),
    background-color var(--duration-fast) var(--ease-standard);
}
.dialog__close:hover {
  color: var(--text-primary);
  background-color: var(--surface-card-sunk);
}
.dialog__close:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.dialog__description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-snug);
  margin: 0 0 var(--space-4);
}

.dialog__body {
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--text-primary);
}

.dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-5);
}
</style>
