<script setup lang="ts">
import { computed } from 'vue';
import type { ScheduleMode } from '@/features/Lobby/Edit/composables/schedule-mode';
import { SCHEDULE_MODE_OPTIONS } from '@/features/Lobby/Edit/composables/schedule-mode';

const model = defineModel<ScheduleMode>({ required: true });

const options = computed(() =>
  SCHEDULE_MODE_OPTIONS.map((option) => ({
    ...option,
    isSelected: option.value === model.value,
  })),
);
</script>

<template>
  <fieldset class="mode-switch">
    <legend class="mode-switch__legend">日程の決め方</legend>
    <div class="mode-switch__options">
      <label
        v-for="option in options"
        :key="option.value"
        class="mode-switch__option"
        :class="{ 'mode-switch__option--selected': option.isSelected }"
      >
        <input
          v-model="model"
          class="mode-switch__input"
          type="radio"
          name="schedule-mode"
          :value="option.value"
        />
        <span class="mode-switch__label">{{ option.label }}</span>
        <span class="mode-switch__description">{{ option.description }}</span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
/* 2択なので、ラジオの点ではなく面で選ばせる。選択は --primary-subtle で示し、
   ベタ塗りにはしない（デザインシステムの選択状態の作法）。 */
.mode-switch {
  border: none;
  margin: 0;
  padding: 0;
}

.mode-switch__legend {
  padding: 0;
  margin-bottom: var(--space-2);
  font: var(--text-label);
  color: var(--text-primary);
}

.mode-switch__options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(15em, 100%), 1fr));
  gap: var(--space-3);
}

.mode-switch__option {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: var(--space-3) var(--space-4);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-card);
  background: var(--surface);
  cursor: pointer;
  transition: var(--transition-control);
}
.mode-switch__option:hover {
  border-color: var(--border-strong);
}
.mode-switch__option--selected {
  border-color: var(--primary);
  background: var(--primary-subtle);
}
.mode-switch__option:focus-within {
  border-color: var(--border-focus);
  box-shadow: var(--focus-ring);
}

.mode-switch__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.mode-switch__label {
  font: var(--text-body-sm);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}
.mode-switch__option--selected .mode-switch__label {
  color: var(--primary-on-subtle);
}

.mode-switch__description {
  font: var(--text-caption);
  color: var(--text-secondary);
}
</style>
