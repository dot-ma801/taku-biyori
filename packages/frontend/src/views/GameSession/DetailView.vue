<script setup lang="ts">
const props = defineProps<{ gameSessionId: string }>();
</script>

<template>
  <h1>GameSession/DetailView.vue</h1>
  <p>{{ props.gameSessionId }}</p>
</template>

<style></style>
