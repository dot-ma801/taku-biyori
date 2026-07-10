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
.card {
  position: relative;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
  font-family:
    'Zen Kaku Gothic New', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
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
    box-shadow var(--duration-base) var(--ease-standard),
    border-color var(--duration-base) var(--ease-standard),
    transform var(--duration-base) var(--ease-standard);
  cursor: pointer;
}
.card--hoverable:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--border-default);
  transform: translateY(-1px);
}

.card__header {
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-subtle);
}
.card__title {
  font-family:
    'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', 'Rounded Mplus 1c',
    sans-serif;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--leading-snug);
}
.card__subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 4px 0 0;
  line-height: var(--leading-snug);
}

.card__body {
  padding: var(--space-5);
}
.card--no-padding .card__body {
  padding: 0;
}

.card__actions {
  position: relative;
  padding: var(--space-3) var(--space-5);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  background: var(--surface-card-sunk);
}
</style>
