<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string;
    height?: string;
    rounded?: 'sm' | 'md' | 'full';
    lines?: number;
  }>(),
  {
    rounded: 'sm',
    lines: 1,
  },
);
</script>

<template>
  <div v-if="lines > 1" class="skeleton-lines">
    <span
      v-for="i in lines"
      :key="i"
      :class="['skeleton', `skeleton--${rounded}`]"
      :style="{
        width: i === lines && lines > 1 ? '70%' : (width ?? '100%'),
        height: height ?? '14px',
      }"
      aria-hidden="true"
    />
  </div>
  <span
    v-else
    :class="['skeleton', `skeleton--${rounded}`]"
    :style="{ width: width ?? '100%', height: height ?? '14px' }"
    aria-hidden="true"
  />
</template>

<style scoped>
.skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* DS: a slow, low-contrast shimmer — never a flashing pulse. */
.skeleton {
  display: block;
  background: var(--surface-subtle);
  background-image: linear-gradient(
    90deg,
    var(--surface-subtle) 0%,
    color-mix(in oklab, var(--surface-subtle) 60%, var(--border-subtle)) 50%,
    var(--surface-subtle) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s var(--ease-standard) infinite;
}
.skeleton--sm {
  border-radius: var(--radius-xs);
}
.skeleton--md {
  border-radius: var(--radius-md);
}
.skeleton--full {
  border-radius: var(--radius-full);
}

@keyframes shimmer {
  from {
    background-position: 120% 0;
  }
  to {
    background-position: -20% 0;
  }
}
</style>
