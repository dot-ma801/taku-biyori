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
  font-family:
    'Zen Kaku Gothic New', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
}

.tabs__list {
  display: flex;
  border-bottom: 1px solid var(--border-subtle);
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
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-normal);
  color: var(--text-secondary);
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition:
    color var(--duration-base) var(--ease-standard),
    border-color var(--duration-base) var(--ease-standard);
  white-space: nowrap;
  font-family:
    'Zen Kaku Gothic New', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
}
.tabs__item:hover:not(:disabled) {
  color: var(--text-primary);
}
.tabs__item[aria-selected='true'],
.tabs__item[data-state='active'] {
  color: var(--brand-primary);
  border-bottom-color: var(--brand-primary);
}
.tabs__item:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.tabs__item:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
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
  font-size: var(--text-sm);
  color: var(--text-primary);
  line-height: var(--leading-normal);
}
</style>
