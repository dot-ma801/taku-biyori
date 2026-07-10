<script setup lang="ts">
import type { LucideIcon } from '@lucide/vue';

defineProps<{
  icon?: LucideIcon;
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="empty-state">
    <div v-if="icon" class="empty-state__icon-circle" aria-hidden="true">
      <component :is="icon" :size="28" />
    </div>
    <p class="empty-state__title">{{ title }}</p>
    <p v-if="description" class="empty-state__description">{{ description }}</p>
    <div v-if="$slots.default" class="empty-state__actions">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-12) var(--space-6);
  font-family:
    'Zen Kaku Gothic New', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
}

.empty-state__icon-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: var(--brand-primary-soft);
  color: var(--brand-primary);
  margin-bottom: var(--space-4);
}

.empty-state__title {
  font-family:
    'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', 'Rounded Mplus 1c',
    sans-serif;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--leading-snug);
}

.empty-state__description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: var(--space-2) 0 0;
  line-height: var(--leading-normal);
  max-width: 32em;
}

.empty-state__actions {
  margin-top: var(--space-5);
  display: flex;
  gap: var(--space-2);
}
</style>
