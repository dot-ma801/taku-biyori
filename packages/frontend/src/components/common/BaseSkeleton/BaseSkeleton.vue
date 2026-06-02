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

.skeleton {
  display: block;
  background: var(--color-surface-muted);
  background-image: linear-gradient(
    90deg,
    var(--color-surface-muted) 0%,
    var(--color-surface-raised) 50%,
    var(--color-surface-muted) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
.skeleton--sm {
  border-radius: var(--radius-sm);
}
.skeleton--md {
  border-radius: var(--radius-md);
}
.skeleton--full {
  border-radius: var(--radius-full);
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
