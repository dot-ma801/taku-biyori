<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router';

withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    noPadding?: boolean;
    hoverable?: boolean;
    link?: { to: RouteLocationRaw; label: string };
  }>(),
  {},
);
</script>

<template>
  <div
    :class="[
      'card',
      { 'card--hoverable': hoverable || !!link, 'card--no-padding': noPadding },
    ]"
  >
    <RouterLink
      v-if="link"
      :to="link.to"
      class="card__link"
      :aria-label="link.label"
    />
    <div v-if="title || subtitle || $slots.header" class="card__header">
      <slot name="header">
        <div>
          <p v-if="title" class="card__title">{{ title }}</p>
          <p v-if="subtitle" class="card__subtitle">{{ subtitle }}</p>
        </div>
      </slot>
    </div>
    <div v-if="$slots.default" class="card__body">
      <slot />
    </div>
    <div v-if="$slots.actions" class="card__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
/* DS: hierarchy comes from border + surface first, shadow last. A resting
   card is a hairline --border-subtle with almost no shadow; hover adds
   --shadow-md and lifts 1px. */
.card {
  position: relative;
  background: var(--surface);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-xs);
  font-family: var(--font-body);
  overflow: hidden;
}

.card__link {
  position: absolute;
  inset: 0;
  z-index: 1;
}
/* Stretched-link: link オーバーレイより上にインタラクティブ要素を出してクリック可能にする */
.card__actions {
  z-index: 2;
}
.card__body
  :is(a, button, [role='button'], input, select, textarea, label, summary) {
  position: relative;
  z-index: 2;
}
.card--hoverable {
  transition:
    box-shadow var(--duration-normal) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
  cursor: pointer;
}
.card--hoverable:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-strong);
  transform: translateY(-1px);
}

.card__header {
  padding: var(--space-4) var(--card-padding);
  border-bottom: var(--border-width) solid var(--border-subtle);
}
.card__title {
  font: var(--text-h3);
  color: var(--text-primary);
  margin: 0;
}
.card__subtitle {
  font: var(--text-body-sm);
  color: var(--text-secondary);
  margin: 2px 0 0;
}

.card__body {
  padding: var(--card-padding);
}
.card--no-padding .card__body {
  padding: 0;
}

.card__actions {
  position: relative;
  padding: var(--space-3) var(--card-padding);
  border-top: var(--border-width) solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  background: var(--surface-subtle);
}
</style>
