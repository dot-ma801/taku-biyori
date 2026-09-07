<script setup lang="ts">
import { Tabs } from '@vuetify/v0';

export interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

defineProps<{
  tabs: TabItem[];
  label?: string;
  stretch?: boolean;
  fixedHeight?: boolean;
}>();

const model = defineModel<string>();
</script>

<template>
  <Tabs.Root v-model="model" class="tabs">
    <Tabs.List
      :label="label ?? 'タブ'"
      :class="['tabs__list', { 'tabs__list--stretch': stretch }]"
    >
      <Tabs.Item
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        :disabled="tab.disabled"
        class="tabs__item"
      >
        {{ tab.label }}
      </Tabs.Item>
    </Tabs.List>

    <div
      :class="['tabs__panels', { 'tabs__panels--fixed-height': fixedHeight }]"
    >
      <Tabs.Panel
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        class="tabs__panel"
      >
        <slot :name="tab.value" />
      </Tabs.Panel>
    </div>
  </Tabs.Root>
</template>

<style scoped>
.tabs {
  font-family: var(--font-body);
}

/* DS: underline tabs. The active indicator is the sun accent — the one
   place the accent colour appears in navigation. */
.tabs__list {
  display: flex;
  gap: var(--space-5);
  border-bottom: var(--border-width) solid var(--border-subtle);
  padding: 0;
  margin: 0;
  list-style: none;
}

.tabs__list--stretch .tabs__item {
  flex: 1;
  text-align: center;
}

.tabs__item {
  padding: 8px 2px 12px;
  font: var(--text-body-sm);
  color: var(--text-secondary);
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  border-radius: 2px 2px 0 0;
  margin-bottom: -1px;
  transition:
    color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard);
  white-space: nowrap;
}
.tabs__item:hover:not(:disabled) {
  color: var(--text-primary);
}
.tabs__item[aria-selected='true'],
.tabs__item[data-state='active'] {
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  border-bottom-color: var(--accent-line);
}
.tabs__item:disabled {
  color: var(--text-disabled);
  cursor: not-allowed;
}
.tabs__item:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.tabs__panels {
  padding-top: var(--space-4);
}

.tabs__panels--fixed-height {
  display: grid;
}

.tabs__panels--fixed-height .tabs__panel {
  grid-column: 1;
  grid-row: 1;
}

.tabs__panels--fixed-height .tabs__panel[hidden] {
  display: block !important;
  visibility: hidden;
}

.tabs__panel {
  font: var(--text-body);
  color: var(--text-primary);
}
</style>
