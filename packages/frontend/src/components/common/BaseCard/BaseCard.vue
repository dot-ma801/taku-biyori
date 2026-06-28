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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  font-family: var(--font-family-base);
  overflow: hidden;
}

.card__link {
  position: absolute;
  inset: 0;
}
.card--hoverable {
  transition:
    box-shadow 0.15s,
    border-color 0.15s;
  cursor: pointer;
}
.card--hoverable:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-strong);
}

.card__header {
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}
.card__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  line-height: 1.3;
}
.card__subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 4px 0 0;
  line-height: 1.4;
}

.card__body {
  padding: var(--space-5);
}
.card--no-padding .card__body {
  padding: 0;
}

.card__actions {
  padding: var(--space-3) var(--space-5);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  background: var(--color-surface-raised);
}
</style>
