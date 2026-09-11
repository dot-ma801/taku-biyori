<script setup lang="ts">
import { computed } from 'vue';
import { ChevronRight } from '@lucide/vue';
import type { RouteLocationRaw } from 'vue-router';

export type BreadcrumbItem = {
  /** 表示するラベル */
  label: string;
  /** 遷移先。省略するとリンクにせず文字だけを出す */
  to?: RouteLocationRaw;
};

const props = withDefaults(
  defineProps<{
    items: BreadcrumbItem[];
    /** ナビゲーション自体のアクセシブルネーム */
    label?: string;
  }>(),
  { label: 'パンくずリスト' },
);

/**
 * 表示用の行データ。末尾は現在地なのでリンクにしない
 * （`to` があっても無視する）。判定はここに集約し、template は分岐を持たない。
 */
const rows = computed(() =>
  props.items.map((item, index) => {
    const isCurrent = index === props.items.length - 1;
    return {
      key: `${index}-${item.label}`,
      label: item.label,
      to: item.to,
      isCurrent,
      isLink: !isCurrent && item.to !== undefined,
      // 現在地だけに付ける。template に三項演算子を書かないため、ここで解決する
      ariaCurrent: isCurrent ? ('page' as const) : undefined,
    };
  }),
);
</script>

<template>
  <nav class="breadcrumb" :aria-label="label">
    <ol class="breadcrumb__list">
      <li v-for="row in rows" :key="row.key" class="breadcrumb__item">
        <RouterLink v-if="row.isLink" class="breadcrumb__link" :to="row.to!">
          {{ row.label }}
        </RouterLink>
        <span
          v-else
          class="breadcrumb__current"
          :aria-current="row.ariaCurrent"
        >
          {{ row.label }}
        </span>
        <ChevronRight
          v-if="!row.isCurrent"
          class="breadcrumb__separator"
          :size="14"
          aria-hidden="true"
        />
      </li>
    </ol>
  </nav>
</template>

<style scoped>
/* DS: breadcrumbs sit at caption size — the trail should recede, the current
   page is the only item in --text-primary. */
.breadcrumb {
  font-family: var(--font-body);
}

.breadcrumb__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.breadcrumb__item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  /* 長いロビー名で1行を占有しないよう、各項目を折り返し可能にする */
  min-width: 0;
}

.breadcrumb__link {
  font: var(--text-caption);
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: var(--transition-control);
}

.breadcrumb__link:hover {
  color: var(--text-primary);
  text-decoration: underline;
}

.breadcrumb__link:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.breadcrumb__current {
  font: var(--text-caption);
  color: var(--text-primary);
}

.breadcrumb__separator {
  color: var(--text-tertiary);
  flex-shrink: 0;
}
</style>
