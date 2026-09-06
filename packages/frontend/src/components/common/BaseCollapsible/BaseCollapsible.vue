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
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius-card);
  font-family: var(--font-body);
  overflow: hidden;
}

.collapsible__activator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--surface-subtle);
  border: none;
  cursor: pointer;
  text-align: left;
  transition: var(--transition-control);
}
.collapsible__activator:hover {
  background: var(--primary-subtle);
}
.collapsible__activator:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.collapsible__title {
  font: var(--text-body-sm);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

.collapsible__cue {
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
}

.collapsible__content {
  padding: var(--space-4);
  font: var(--text-body-sm);
  color: var(--text-primary);
  border-top: var(--border-width) solid var(--border-subtle);
  background: var(--surface);
}
</style>
