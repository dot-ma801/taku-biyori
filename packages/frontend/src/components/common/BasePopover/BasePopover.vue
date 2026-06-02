<script setup lang="ts">
import { computed, useId } from 'vue';
import { Popover } from '@vuetify/v0';

type Placement =
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'top'
  | 'top-start'
  | 'top-end';

const props = withDefaults(
  defineProps<{
    placement?: Placement;
    modelValue?: boolean;
  }>(),
  {
    placement: 'bottom-end',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const POSITION_AREA_MAP: Record<Placement, string> = {
  bottom: 'bottom',
  'bottom-start': 'bottom left',
  'bottom-end': 'bottom right',
  top: 'top',
  'top-start': 'top left',
  'top-end': 'top right',
};

const positionArea = computed(() => POSITION_AREA_MAP[props.placement]);
const id = useId();
</script>

<template>
  <div class="popover">
    <Popover.Root
      :id="id"
      :model-value="props.modelValue"
      @update:model-value="emit('update:modelValue', $event)"
    >
      <Popover.Activator class="popover__activator">
        <slot name="activator" />
      </Popover.Activator>
      <Popover.Content
        :id="id"
        :position-area="positionArea"
        class="popover__content"
      >
        <slot />
      </Popover.Content>
    </Popover.Root>
  </div>
</template>

<style scoped>
.popover {
  position: relative;
  display: inline-flex;
}

.popover__activator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: var(--radius-full);
  color: var(--color-text);
  transition: color 0.15s;
}

.popover__activator:hover {
  color: var(--color-primary);
}

.popover__activator:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.popover__content {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-width: 160px;
  font-family: var(--font-family-base);
  z-index: 100;
}
</style>
