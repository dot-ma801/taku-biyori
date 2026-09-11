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
/* v0.4 のシェルにフッター帯は無い。バージョン表記だけは残したいので、
   主張しない hairline の一行に落とす。 */
footer {
  background: var(--surface);
  color: var(--text-tertiary);
  border-top: var(--border-width) solid var(--border-subtle);
  text-align: center;
  padding: var(--space-4);
}

.version {
  font: var(--text-caption);
  font-variant-numeric: tabular-nums;
}
</style>
