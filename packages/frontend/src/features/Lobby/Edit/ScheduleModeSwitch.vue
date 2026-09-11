<script setup lang="ts">
import type { ScheduleMode } from '@/features/Lobby/Edit/composables/schedule-mode';
import { useScheduleModeOptions } from '@/features/Lobby/Edit/composables/useScheduleModeOptions';

const model = defineModel<ScheduleMode>({ required: true });

const { options } = useScheduleModeOptions(() => model.value);
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
        <!-- 選択の印。面（カード）だけだと「今どちらが選ばれているか」を
             色の違いだけに頼ることになるため、ラジオの丸も残す -->
        <span class="mode-switch__mark" aria-hidden="true"></span>
        <span class="mode-switch__body">
          <span class="mode-switch__label">{{ option.label }}</span>
          <span class="mode-switch__description">{{ option.description }}</span>
        </span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
/* 2択なので面（カード）で選ばせるが、ラジオの丸は残す。選択は --primary-subtle で
   示し、ベタ塗りにはしない（デザインシステムの選択状態の作法）。 */
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
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 10px;
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

/* BaseRadioGroup と同じ 18px の丸。入力自体は隠しているので、
   選択の見た目はこの要素だけで作る */
.mode-switch__mark {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  border-radius: var(--radius-full);
  background: var(--surface);
  border: var(--border-width-strong) solid var(--border-strong);
  transition: var(--transition-control);
}
.mode-switch__option--selected .mode-switch__mark {
  border-color: var(--primary);
  /* 中心の点はグラデーションで描く（余計な要素を足さない） */
  background:
    radial-gradient(
      circle at center,
      var(--primary) 0 4px,
      transparent 4px 100%
    ),
    var(--surface);
}

.mode-switch__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
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
