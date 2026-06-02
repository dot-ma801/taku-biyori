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
  border-top: 1px solid var(--color-border);
  margin: 0;
  width: 100%;
}
.divider--vertical {
  border-top: none;
  border-left: 1px solid var(--color-border);
  width: auto;
  height: 100%;
  align-self: stretch;
}
.divider--labeled {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-family-base);
}
.divider__line {
  flex: 1;
  height: 1px;
  background: var(--color-border);
}
.divider__label {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
}
</style>
