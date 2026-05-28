<script setup lang="ts">
import { UserRound } from '@lucide/vue';

</script>

<template>
  <button @click="">
    <UserRound/>
  </button>
</template>

<style scoped>
button {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  margin-left: auto;
  display: flex;
  align-items: center;

  border: 2px solid var(--color-on-primary);
  border-radius: var(--radius-full)
}
</style>
