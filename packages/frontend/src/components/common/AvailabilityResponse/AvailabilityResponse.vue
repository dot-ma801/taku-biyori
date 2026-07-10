<script setup lang="ts">
import { computed } from 'vue';

type ResponseValue = 'maru' | 'sankaku' | 'batsu' | null;

const props = withDefaults(
  defineProps<{
    modelValue?: ResponseValue;
    size?: number;
    disabled?: boolean;
  }>(),
  {
    modelValue: null,
    size: 44,
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: ResponseValue];
}>();

const OPTIONS = [
  { value: 'maru' as const, glyph: '○', label: '参加できます' },
  { value: 'sankaku' as const, glyph: '△', label: '未定' },
  { value: 'batsu' as const, glyph: '×', label: '参加できません' },
];

const sizePx = computed(() => `${props.size}px`);
const glyphSizePx = computed(() => `${Math.round(props.size * 0.5)}px`);

function select(value: 'maru' | 'sankaku' | 'batsu') {
  if (props.disabled) {
    return;
  }
  // toggle off if already selected
  const next = props.modelValue === value ? null : value;
  emit('update:modelValue', next);
}

function isActive(value: 'maru' | 'sankaku' | 'batsu') {
  return props.modelValue === value;
}
</script>

<template>
  <div
    class="availability"
    role="radiogroup"
    aria-label="参加可否"
    :style="{ '--_size': sizePx, '--_glyph-size': glyphSizePx }"
  >
    <button
      v-for="option in OPTIONS"
      :key="option.value"
      type="button"
      :class="[
        'availability__btn',
        `availability__btn--${option.value}`,
        { 'availability__btn--active': isActive(option.value) },
      ]"
      :title="option.label"
      :aria-label="option.label"
      :aria-checked="isActive(option.value)"
      :disabled="disabled"
      role="radio"
      @click="select(option.value)"
    >
      <span aria-hidden="true">{{ option.glyph }}</span>
    </button>
  </div>
</template>

<style scoped>
.availability {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.availability__btn {
  width: var(--_size);
  height: var(--_size);
  border-radius: var(--radius-full);
  border: 1.5px solid var(--border-default);
  background: var(--surface-card);
  color: var(--text-tertiary);
  font-family:
    'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', 'Rounded Mplus 1c',
    sans-serif;
  font-size: var(--_glyph-size);
  font-weight: var(--weight-bold);
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
  padding: 0;
}
.availability__btn:hover:not(:disabled) {
  border-color: var(--border-strong);
  color: var(--text-secondary);
}
.availability__btn:active:not(:disabled) {
  transform: scale(0.96);
}
.availability__btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
.availability__btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

/* Active states */
.availability__btn--maru.availability__btn--active {
  background: var(--resp-maru-soft);
  border-color: var(--resp-maru);
  color: var(--resp-maru);
}
.availability__btn--sankaku.availability__btn--active {
  background: var(--resp-sankaku-soft);
  border-color: var(--resp-sankaku);
  color: var(--resp-sankaku);
}
.availability__btn--batsu.availability__btn--active {
  background: var(--resp-batsu-soft);
  border-color: var(--resp-batsu);
  color: var(--resp-batsu);
}
</style>
