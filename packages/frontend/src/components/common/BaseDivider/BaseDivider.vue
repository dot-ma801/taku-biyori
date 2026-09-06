<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    vertical?: boolean;
  }>(),
  {},
);
</script>

<template>
  <div v-if="label" class="divider--labeled" role="separator">
    <span class="divider__line" />
    <span class="divider__label">{{ label }}</span>
    <span class="divider__line" />
  </div>
  <hr
    v-else
    :class="['divider', { 'divider--vertical': vertical }]"
    role="separator"
  />
</template>

<style scoped>
.divider {
  border: none;
  border-top: var(--border-width) solid var(--border-subtle);
  margin: 0;
  width: 100%;
}
.divider--vertical {
  border-top: none;
  border-left: var(--border-width) solid var(--border-subtle);
  width: auto;
  height: 100%;
  align-self: stretch;
}
.divider--labeled {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-body);
}
.divider__line {
  flex: 1;
  height: var(--border-width);
  background: var(--border-subtle);
}
.divider__label {
  font: var(--text-caption);
  color: var(--text-tertiary);
  white-space: nowrap;
}
</style>
