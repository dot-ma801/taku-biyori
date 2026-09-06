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
/* Field chrome matches BaseTextBox; the calendar popover is a --radius-md
   sheet on --surface-raised, and selection uses --primary-subtle (never a
   filled brand colour on a date cell). */
.datepicker {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-family: var(--font-body);
}

.datepicker__label {
  font: var(--text-label);
  color: var(--text-primary);
}

.datepicker__required {
  color: var(--error);
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
  height: 40px;
  padding: 0 12px;
  background: var(--surface);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-control);
  font: var(--text-body-sm);
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  transition: var(--transition-control);
}
.datepicker__trigger:hover:not(:disabled) {
  border-color: var(--border-strong);
}
.datepicker__trigger:focus-visible {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: var(--focus-ring);
}
.datepicker__trigger:disabled {
  color: var(--text-disabled);
  background: var(--surface-subtle);
  border-color: var(--border-subtle);
  cursor: not-allowed;
}

.datepicker__trigger-text {
  flex: 1;
  min-width: 0;
}
.datepicker__trigger-text--placeholder {
  color: var(--text-tertiary);
}
.datepicker__trigger-icon {
  flex-shrink: 0;
  color: var(--text-tertiary);
}

/* クリアボタンの分だけカレンダーアイコンの手前に余白を空ける */
.datepicker__trigger--clearable .datepicker__trigger-text {
  padding-right: var(--space-6);
}

/*
 * セレクタを深くしているのは詳細度のため。
 * BaseCard の `.card__body :is(a, button, ...)` が配下の button に position: relative を
 * 付けており、`.datepicker__clear` 単体（詳細度 0-2-0）では負けてトリガーの外に落ちる。
 */
.datepicker .datepicker__field .datepicker__clear {
  position: absolute;
  top: 50%;
  right: 34px;
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
  color: var(--text-tertiary);
  cursor: pointer;
  transition: var(--transition-control);
}
.datepicker__clear:hover {
  background: var(--surface-subtle);
  color: var(--text-primary);
}
.datepicker__clear:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.datepicker__popover {
  background: var(--surface-raised);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
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
  font: var(--text-label);
  color: var(--text-primary);
}

.datepicker__nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-control);
}
.datepicker__nav-btn:hover {
  background: var(--surface-subtle);
  color: var(--text-primary);
}
.datepicker__nav-btn:focus-visible {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: var(--focus-ring);
}

.datepicker__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: var(--space-1);
}

.datepicker__weekday {
  text-align: center;
  font: var(--text-overline);
  color: var(--text-tertiary);
  padding: 4px 0;
}
.datepicker__weekday--sun {
  color: var(--error);
}
.datepicker__weekday--sat {
  color: var(--primary);
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
  font: var(--text-body-sm);
  color: var(--text-primary);
  cursor: pointer;
  transition: var(--transition-control);
}
.datepicker__cell--empty {
  cursor: default;
  pointer-events: none;
}
.datepicker__cell:hover:not(:disabled):not(.datepicker__cell--empty):not(
    .datepicker__cell--selected
  ) {
  background: var(--surface-subtle);
}
.datepicker__cell:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
.datepicker__cell--today {
  position: relative;
}
/* 当日は 1px 幅の丸枠で示す */
.datepicker__cell--today::after {
  content: '';
  position: absolute;
  inset: 2px;
  border: var(--border-width) solid var(--primary);
  border-radius: var(--radius-full);
  pointer-events: none;
}
.datepicker__cell--selected {
  background: var(--primary-subtle);
  color: var(--primary-on-subtle);
  font-weight: var(--weight-semibold);
}
.datepicker__cell--selected:hover {
  background: var(--primary-subtle-hover);
}
.datepicker__cell--disabled {
  color: var(--text-disabled);
  cursor: not-allowed;
}
</style>
