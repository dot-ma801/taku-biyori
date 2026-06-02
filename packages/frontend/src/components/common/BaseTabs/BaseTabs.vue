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
  font-family: var(--font-family-base);
}

.tabs__list {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  gap: 0;
  padding: 0;
  margin: 0;
  list-style: none;
}

.tabs__list--stretch .tabs__item {
  flex: 1;
  text-align: center;
}

.tabs__item {
  padding: 10px var(--space-4);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--color-text-muted);
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition:
    color 0.15s,
    border-color 0.15s;
  white-space: nowrap;
  font-family: var(--font-family-base);
}
.tabs__item:hover:not(:disabled) {
  color: var(--color-text);
}
.tabs__item[aria-selected='true'],
.tabs__item[data-state='active'] {
  color: var(--color-primary-text);
  border-bottom-color: var(--color-primary-text);
}
.tabs__item:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.tabs__item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
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
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.65;
}
</style>
