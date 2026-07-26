<script setup lang="ts">
// FIXME: @vuetify/v0 に DatePicker が追加されたら、カレンダーロジックをそちらに置き換える
// https://0.vuetifyjs.com/components/date-picker
import { computed, ref } from 'vue';
import { Popover } from '@vuetify/v0';
import { ChevronLeft, ChevronRight, CalendarDays, X } from '@lucide/vue';
import { todayDateString } from '@taku-biyori/shared';

// multiple=false のとき string | undefined、multiple=true のとき string[] を想定
type ModelValue = string | string[];

const props = withDefaults(
  defineProps<{
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    min?: string;
    max?: string;
    /** true のとき複数日選択モード。v-model は string[] で使う */
    multiple?: boolean;
    /** true のとき今日より前の日付を選択不可にする */
    disablePast?: boolean;
    /** true のとき選択済みの値を消すクリアボタンを表示する（任意入力の項目向け） */
    clearable?: boolean;
  }>(),
  {
    placeholder: '日付を選択',
    multiple: false,
  },
);

const model = defineModel<ModelValue>();
const isOpen = ref(false);

// 内部的には常に string[] で扱う
const selectedDates = computed<string[]>(() => {
  if (!model.value) {
    return [];
  }
  return Array.isArray(model.value) ? model.value : [model.value];
});

// 表示中の年月（選択済み or 今日を基準に初期化）
const today = new Date();
const initialDate = Array.isArray(model.value) ? model.value[0] : model.value;
const displayYear = ref(
  initialDate ? parseInt(initialDate.slice(0, 4)) : today.getFullYear(),
);
const displayMonth = ref(
  initialDate ? parseInt(initialDate.slice(5, 7)) - 1 : today.getMonth(),
);

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const MONTHS = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
];

// カレンダーに表示する日付セルを生成
const calendarCells = computed(() => {
  const year = displayYear.value;
  const month = displayMonth.value;
  const firstDay = new Date(year, month, 1).getDay(); // 0=日
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ date: string | null; day: number | null }> = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push({ date: null, day: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push({ date: `${year}-${mm}-${dd}`, day: d });
  }
  return cells;
});

const todayStr = todayDateString();

const displayLabel = computed<string | null>(() => {
  const dates = selectedDates.value;
  if (dates.length === 0) {
    return null;
  }
  if (props.multiple) {
    return dates.length === 1
      ? formatDate(dates[0]!)
      : `${dates.length}件選択中`;
  }
  return formatDate(dates[0]!);
});

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-');
  return `${parts[0]}/${parseInt(parts[1] ?? '0')}/${parseInt(parts[2] ?? '0')}`;
}

function isSelected(dateStr: string): boolean {
  return selectedDates.value.includes(dateStr);
}

function prevMonth() {
  if (displayMonth.value === 0) {
    displayMonth.value = 11;
    displayYear.value--;
  } else {
    displayMonth.value--;
  }
}

function nextMonth() {
  if (displayMonth.value === 11) {
    displayMonth.value = 0;
    displayYear.value++;
  } else {
    displayMonth.value++;
  }
}

function isDisabled(dateStr: string): boolean {
  if (props.disablePast && dateStr < todayStr) {
    return true;
  }
  if (props.min && dateStr < props.min) {
    return true;
  }
  if (props.max && dateStr > props.max) {
    return true;
  }
  return false;
}

const showClear = computed(
  () => props.clearable && !props.disabled && selectedDates.value.length > 0,
);

const clearAriaLabel = computed(() => `${props.label ?? '日付'}をクリア`);

// 選択済みの値を空に戻す。multiple かどうかで空の表現が異なる点に注意
function clear() {
  model.value = props.multiple ? [] : '';
}

function selectDate(dateStr: string | null) {
  if (!dateStr || isDisabled(dateStr)) {
    return;
  }
  if (props.multiple) {
    const current = selectedDates.value;
    const next = current.includes(dateStr)
      ? current.filter((d) => d !== dateStr)
      : [...current, dateStr];
    model.value = next;
  } else {
    model.value = dateStr;
    isOpen.value = false;
  }
}
</script>

<template>
  <div class="datepicker">
    <span v-if="label" class="datepicker__label">
      {{ label }}<span v-if="required" class="datepicker__required">*</span>
    </span>
    <div class="datepicker__field">
      <Popover.Root v-model="isOpen">
        <!-- Activator 自体が button を描画するため、内側に button を置くと枠線が二重になる -->
        <Popover.Activator
          :class="[
            'datepicker__trigger',
            showClear && 'datepicker__trigger--clearable',
          ]"
          :disabled="disabled"
          :aria-label="label ?? '日付を選択'"
        >
          <span
            :class="[
              'datepicker__trigger-text',
              !displayLabel && 'datepicker__trigger-text--placeholder',
            ]"
          >
            {{ displayLabel ?? placeholder }}
          </span>
          <CalendarDays
            :size="14"
            class="datepicker__trigger-icon"
            aria-hidden="true"
          />
        </Popover.Activator>

        <Popover.Content class="datepicker__popover">
          <template #default>
            <!-- ナビゲーション -->
            <div class="datepicker__nav">
              <button
                type="button"
                class="datepicker__nav-btn"
                aria-label="前の月"
                @click="prevMonth"
              >
                <ChevronLeft :size="14" aria-hidden="true" />
              </button>
              <span class="datepicker__nav-title">
                {{ displayYear }}年{{ MONTHS[displayMonth] }}
              </span>
              <button
                type="button"
                class="datepicker__nav-btn"
                aria-label="次の月"
                @click="nextMonth"
              >
                <ChevronRight :size="14" aria-hidden="true" />
              </button>
            </div>

            <!-- 曜日ヘッダー -->
            <div class="datepicker__weekdays" role="row">
              <span
                v-for="wd in WEEKDAYS"
                :key="wd"
                class="datepicker__weekday"
                :class="{
                  'datepicker__weekday--sun': wd === '日',
                  'datepicker__weekday--sat': wd === '土',
                }"
                role="columnheader"
                >{{ wd }}</span
              >
            </div>

            <!-- 日付グリッド -->
            <div class="datepicker__grid" role="grid">
              <button
                v-for="(cell, i) in calendarCells"
                :key="i"
                type="button"
                class="datepicker__cell"
                :class="{
                  'datepicker__cell--empty': !cell.date,
                  'datepicker__cell--today': cell.date === todayStr,
                  'datepicker__cell--selected':
                    cell.date !== null && isSelected(cell.date),
                  'datepicker__cell--disabled':
                    cell.date !== null && isDisabled(cell.date),
                }"
                :disabled="cell.date === null || isDisabled(cell.date)"
                :aria-selected="
                  cell.date !== null ? isSelected(cell.date) : undefined
                "
                :aria-label="cell.date ?? undefined"
                role="gridcell"
                @click="selectDate(cell.date)"
              >
                {{ cell.day }}
              </button>
            </div>
          </template>
        </Popover.Content>
      </Popover.Root>

      <!-- Activator 自体が button のため入れ子にできない。トリガーの上に重ねて配置する -->
      <button
        v-if="showClear"
        type="button"
        class="datepicker__clear"
        :aria-label="clearAriaLabel"
        @click="clear"
      >
        <X :size="14" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.datepicker {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-family: var(--font-family-base);
}

.datepicker__label {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--color-text-secondary);
}

.datepicker__required {
  color: var(--color-error);
  margin-left: 2px;
}

/* クリアボタンをトリガーに重ねるための基準 */
.datepicker__field {
  position: relative;
}

.datepicker__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  padding: 10px 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-base);
  font-size: 14px;
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.datepicker__trigger:hover:not(:disabled) {
  border-color: var(--color-secondary);
}
.datepicker__trigger:focus-visible {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-soft);
}
.datepicker__trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-surface-muted);
}

.datepicker__trigger-text {
  flex: 1;
}
.datepicker__trigger-text--placeholder {
  color: var(--color-text-muted);
}
.datepicker__trigger-icon {
  flex-shrink: 0;
  color: var(--color-text-muted);
}

/* クリアボタンの分だけカレンダーアイコンの手前に余白を空ける */
.datepicker__trigger--clearable .datepicker__trigger-text {
  padding-right: var(--space-5);
}

.datepicker__clear {
  position: absolute;
  top: 50%;
  right: 32px;
  transform: translateY(-50%);

  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;

  background: transparent;
  border: none;
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    background-color 0.1s,
    color 0.1s;
}
.datepicker__clear:hover {
  background: var(--color-surface-raised);
  color: var(--color-text);
}
.datepicker__clear:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primary-soft);
}

.datepicker__popover {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: var(--space-3);
  width: 256px;
}

.datepicker__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.datepicker__nav-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.datepicker__nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color 0.1s;
}
.datepicker__nav-btn:hover {
  background: var(--color-surface-raised);
}
.datepicker__nav-btn:focus-visible {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-soft);
}

.datepicker__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: var(--space-1);
}

.datepicker__weekday {
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-muted);
  padding: 4px 0;
}
.datepicker__weekday--sun {
  color: var(--color-error);
}
.datepicker__weekday--sat {
  color: var(--color-primary);
}

.datepicker__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.datepicker__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-family-base);
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
  transition: background-color 0.1s;
}
.datepicker__cell--empty {
  cursor: default;
  pointer-events: none;
}
.datepicker__cell:hover:not(:disabled):not(.datepicker__cell--empty):not(
    .datepicker__cell--selected
  ) {
  background: var(--color-surface-raised);
}
.datepicker__cell:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primary-soft);
}
.datepicker__cell--today {
  position: relative;
}
/* 当日は 1px 幅の丸枠で示す */
.datepicker__cell--today::after {
  content: '';
  position: absolute;
  inset: 2px;
  border: 1px solid var(--color-primary-text);
  border-radius: var(--radius-full);
  pointer-events: none;
}
.datepicker__cell--selected {
  background: var(--color-primary-soft);
  color: var(--color-primary-strong);
  font-weight: 500;
}
.datepicker__cell--selected:hover {
  background: color-mix(
    in srgb,
    var(--color-primary-soft),
    var(--color-primary) 15%
  );
}
.datepicker__cell--disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
