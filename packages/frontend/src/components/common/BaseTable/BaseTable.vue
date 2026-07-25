<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed, ref } from 'vue';
import { ArrowUpDown, ArrowUp, ArrowDown } from '@lucide/vue';

export type TableColumn = {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
};

type SortDirection = 'asc' | 'desc';
type SortState = { key: string; direction: SortDirection } | null;

const props = withDefaults(
  defineProps<{
    columns: TableColumn[];
    rows: T[];
    striped?: boolean;
    hoverable?: boolean;
  }>(),
  {
    striped: false,
    hoverable: false,
  },
);

defineSlots<{
  [key: `cell-${string}`]: (props: { row: T; value: unknown }) => unknown;
  empty?: () => unknown;
}>();

const sortState = ref<SortState>(null);

function getAriaSortValue(
  column: TableColumn,
): 'ascending' | 'descending' | 'none' | undefined {
  if (!column.sortable) return undefined;
  if (sortState.value?.key === column.key) {
    return sortState.value.direction === 'asc' ? 'ascending' : 'descending';
  }
  return 'none';
}

function toggleSort(key: string) {
  if (sortState.value?.key === key) {
    sortState.value =
      sortState.value.direction === 'asc' ? { key, direction: 'desc' } : null;
  } else {
    sortState.value = { key, direction: 'asc' };
  }
}

const sortedRows = computed(() => {
  if (!sortState.value) {
    return props.rows;
  }
  const { key, direction } = sortState.value;
  return [...props.rows].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal == null && bVal == null) {
      return 0;
    }
    if (aVal == null) {
      return 1;
    }
    if (bVal == null) {
      return -1;
    }
    const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return direction === 'asc' ? result : -result;
  });
});
</script>

<template>
  <div class="table-wrapper" role="region" aria-label="データテーブル">
    <table class="table">
      <thead class="table__head">
        <tr class="table__row">
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[
              'table__th',
              `table__th--${col.align ?? 'left'}`,
              { 'table__th--sortable': col.sortable },
            ]"
            scope="col"
            :aria-sort="getAriaSortValue(col)"
            @click="col.sortable ? toggleSort(col.key) : undefined"
          >
            <span class="table__th-inner">
              {{ col.label }}
              <span
                v-if="col.sortable"
                class="table__sort-icon"
                aria-hidden="true"
              >
                <ArrowUp
                  v-if="
                    sortState?.key === col.key && sortState.direction === 'asc'
                  "
                  :size="13"
                />
                <ArrowDown
                  v-else-if="
                    sortState?.key === col.key && sortState.direction === 'desc'
                  "
                  :size="13"
                />
                <ArrowUpDown v-else :size="13" />
              </span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody class="table__body">
        <template v-if="sortedRows.length > 0">
          <tr
            v-for="(row, rowIndex) in sortedRows"
            :key="rowIndex"
            :class="[
              'table__row',
              {
                'table__row--striped': striped && rowIndex % 2 === 1,
                'table__row--hoverable': hoverable,
              },
            ]"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="['table__td', `table__td--${col.align ?? 'left'}`]"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </template>
        <tr v-else>
          <td :colspan="columns.length" class="table__empty">
            <slot name="empty">データがありません</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-family-base);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: var(--color-text);
}

.table__head {
  background: var(--color-surface-raised);
}

.table__th {
  padding: var(--space-3) var(--space-4);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
  border-bottom: 1px solid var(--color-border);
}

.table__th--left {
  text-align: left;
}
.table__th--center {
  text-align: center;
}
.table__th--right {
  text-align: right;
}

.table__th--sortable {
  cursor: pointer;
  user-select: none;
  transition: color 0.1s;
}
.table__th--sortable:hover {
  color: var(--color-text);
}

.table__th-inner {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.table__sort-icon {
  display: flex;
  align-items: center;
  color: var(--color-text-muted);
}
.table__th--sortable:hover .table__sort-icon {
  color: var(--color-text-secondary);
}

.table__row {
  border-bottom: 1px solid var(--color-border);
}
.table__row:last-child {
  border-bottom: none;
}

.table__row--striped {
  background: var(--color-surface-raised);
}

.table__row--hoverable {
  transition: background 0.1s;
  cursor: pointer;
}
.table__row--hoverable:hover {
  background: var(--color-surface-muted);
}

.table__td {
  padding: var(--space-3) var(--space-4);
  color: var(--color-text);
  line-height: 1.55;
}

.table__td--left {
  text-align: left;
}
.table__td--center {
  text-align: center;
}
.table__td--right {
  text-align: right;
}

.table__empty {
  padding: var(--space-6) var(--space-4);
  text-align: center;
  color: var(--color-text-muted);
  font-size: 14px;
}
</style>
