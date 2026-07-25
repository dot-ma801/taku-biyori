<script setup lang="ts">
import { Collapsible } from '@vuetify/v0';
import { ChevronDown } from '@lucide/vue';

defineProps<{
  title: string;
  defaultOpen?: boolean;
}>();

const open = defineModel<boolean>({ default: false });
</script>

<template>
  <Collapsible.Root
    v-model:open="open"
    :default-open="defaultOpen"
    class="collapsible"
  >
    <Collapsible.Activator class="collapsible__activator">
      <span class="collapsible__title">{{ title }}</span>
      <Collapsible.Cue v-slot="{ isOpen }" class="collapsible__cue">
        <ChevronDown
          :size="16"
          :style="{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }"
        />
      </Collapsible.Cue>
    </Collapsible.Activator>
    <Collapsible.Content class="collapsible__content">
      <slot />
    </Collapsible.Content>
  </Collapsible.Root>
</template>

<style scoped>
.collapsible {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-base);
  overflow: hidden;
}

.collapsible__activator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-raised);
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s;
  font-family: var(--font-family-base);
}
.collapsible__activator:hover {
  background: var(--color-surface-muted);
}
.collapsible__activator:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.collapsible__title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  letter-spacing: 0.01em;
}

.collapsible__cue {
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
}

.collapsible__content {
  padding: var(--space-4);
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.65;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}
</style>
