<script setup lang="ts">
import { APP_VERSION } from '@/lib/app-version';

const version = `v${APP_VERSION}`;
</script>

<template>
  <footer>
    <small class="version">{{ version }}</small>
  </footer>
</template>

<style scoped>
footer {
  background-color: var(--color-secondary);
  color: var(--color-on-primary);
  text-align: center;
  padding: var(--space-4);
}

.version {
  font-size: var(--font-size-sm);
  /* 主張しすぎない補足情報として少し落とす */
  opacity: 0.8;
  font-variant-numeric: tabular-nums;
}
</style>
