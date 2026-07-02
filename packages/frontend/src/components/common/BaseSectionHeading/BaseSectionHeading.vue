<script setup lang="ts">
import { computed } from 'vue';
import type { LucideIcon } from '@lucide/vue';

// NOTE: string & {} は string への型の吸収を防ぎ、リテラルの補完を残しつつ任意文字列も受け付けるイディオム
type Color = 'primary' | 'default' | (string & {});
type Level = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

const ICON_SIZE: Record<Level, number> = {
  h1: 28,
  h2: 24,
  h3: 20,
  h4: 18,
  h5: 15,
  h6: 13,
};

const props = withDefaults(
  defineProps<{
    level?: Level;
    icon?: LucideIcon;
    iconColor?: Color;
    textColor?: Color;
  }>(),
  {
    level: 'h2',
    iconColor: 'primary',
    textColor: 'default',
  },
);

const iconSize = computed(() => ICON_SIZE[props.level]);

const iconColorStyle = computed(() => {
  if (props.iconColor === 'primary') {
    return 'var(--_icon-primary-color)';
  }
  if (props.iconColor === 'default') {
    return 'currentcolor';
  }
  return props.iconColor;
});

const textColorStyle = computed(() => {
  if (props.textColor === 'primary') {
    return 'var(--color-primary)';
  }
  if (props.textColor === 'default') {
    return 'currentcolor';
  }
  return props.textColor;
});
</script>

<template>
  <component
    :is="level"
    class="section-heading"
    :style="{ color: textColorStyle }"
  >
    <span
      v-if="icon"
      class="section-heading__icon"
      aria-hidden="true"
      :style="{ color: iconColorStyle }"
    >
      <component :is="icon" :size="iconSize" />
    </span>
    <slot />
  </component>
</template>

<style scoped>
.section-heading {
  --_icon-primary-color: var(--color-primary);

  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  line-height: 1;
  font-family: var(--font-family-base);
  color: var(--color-text);
}

:root[data-theme='dark'] .section-heading {
  --_icon-primary-color: var(--color-primary-text);
}

.section-heading__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
</style>
