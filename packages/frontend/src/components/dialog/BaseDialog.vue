<script setup lang="ts">
import { Dialog } from '@vuetify/v0'

defineProps<{
  title: string
  description?: string
}>()
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

      <!-- actions slot: 各ボタンを Dialog.Close でラップして自動クローズ -->
      <div v-if="$slots.actions" class="dialog__actions">
        <Dialog.Close as-child>
          <slot name="actions" />
        </Dialog.Close>
      </div>
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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: var(--space-5);
  font-family: var(--font-family-base);
  color: var(--color-text);
}

.dialog::backdrop {
  background: rgba(31, 35, 40, 0.4);
}

.dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.dialog__title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  margin: 0;
  color: var(--color-text);
}

.dialog__close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  line-height: 1;
  font-size: 14px;
  transition: color 0.15s, background-color 0.15s;
}
.dialog__close:hover {
  color: var(--color-text);
  background-color: var(--color-surface-raised);
}
.dialog__close:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.dialog__description {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.55;
  margin: 0 0 var(--space-4);
}

.dialog__body {
  font-size: 14px;
  line-height: 1.65;
}

.dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-5);
}
</style>
