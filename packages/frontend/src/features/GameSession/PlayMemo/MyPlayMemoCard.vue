<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { NotebookPen, Lock, ChevronDown, SquarePen } from '@lucide/vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseAlert from '@/components/common/BaseAlert/BaseAlert.vue';
import type { MyGameSessionPlayMemo } from '@taku-biyori/shared';
import { formatDateTimeShort } from '@/utils/date';

/** この文字数を超えたら折りたたむ。長文でも卓詳細の縦丈を一定に保つため */
const COLLAPSE_THRESHOLD = 140;

const props = defineProps<{
  gameSessionId: string;
  playMemo: MyGameSessionPlayMemo | null;
  canEditBody: boolean;
}>();

/** 折りたたみの開閉。UI の状態なのでこのコンポーネントが持つ */
const expanded = ref(false);

const body = computed(() => props.playMemo?.body ?? '');
const hasBody = computed(() => body.value.length > 0);
const isCollapsible = computed(() => body.value.length > COLLAPSE_THRESHOLD);
const isClipped = computed(() => isCollapsible.value && !expanded.value);

const expandLabel = computed(() =>
  expanded.value ? '折りたたむ' : `すべて表示（${body.value.length} 字）`,
);

const updatedLabel = computed(() => {
  const updatedAt = props.playMemo?.updatedAt;
  if (!updatedAt) return '';
  return `${formatDateTimeShort(updatedAt)} に保存`;
});

const editorRoute = computed(() => ({
  name: 'game-sessions-play-memo',
  params: { gameSessionId: props.gameSessionId },
}));

const editLinkLabel = computed(() =>
  hasBody.value ? '書く' : '最初のメモを書く',
);

// 完了・中止で本文が閉じることを、閉じる前から伝える（要求 §4）
const lockNotice =
  '卓が完了・中止すると、本文は編集できなくなります（公開・非公開の切り替えは引き続き行えます）。';
</script>

<template>
  <BaseCard>
    <div class="heading-row">
      <BaseSectionHeading level="h3" :icon="NotebookPen">
        マイメモ
      </BaseSectionHeading>
      <span class="visibility">
        <Lock :size="12" aria-hidden="true" />
        非公開
      </span>
    </div>

    <BaseAlert v-if="!canEditBody" variant="warning">
      卓が完了したため本文は編集できません。公開・非公開の切り替えは引き続き行えます。
    </BaseAlert>

    <template v-if="hasBody">
      <p class="body" :class="{ 'body--clipped': isClipped }">{{ body }}</p>
      <button
        v-if="isCollapsible"
        type="button"
        class="expand"
        @click="expanded = !expanded"
      >
        <ChevronDown
          :size="15"
          class="expand__icon"
          :class="{ 'expand__icon--open': expanded }"
          aria-hidden="true"
        />
        {{ expandLabel }}
      </button>
    </template>

    <p v-else class="empty">プレイ中の気づきを、自分だけのメモに残せます。</p>

    <div class="foot">
      <span class="meta">{{ updatedLabel }}</span>
      <RouterLink v-if="canEditBody" :to="editorRoute" class="edit-link">
        <SquarePen :size="15" aria-hidden="true" />
        {{ editLinkLabel }}
      </RouterLink>
    </div>

    <p v-if="canEditBody" class="notice">{{ lockNotice }}</p>
  </BaseCard>
</template>

<style scoped>
.heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.visibility {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);

  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 12px;
  white-space: nowrap;
}

.body {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}

.body--clipped {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  overflow: hidden;
}

.expand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-top: var(--space-2);
  padding: 0;

  background: none;
  border: none;
  cursor: pointer;

  color: var(--color-primary-text);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.expand__icon {
  transition: transform 0.2s;
}

.expand__icon--open {
  transform: rotate(180deg);
}

.empty {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.meta {
  color: var(--color-text-muted);
  font-size: 12px;
}

.edit-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-left: auto;
  padding: var(--space-2) var(--space-4);

  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-on-primary);

  font-size: var(--font-size-sm);
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
}

.edit-link:hover {
  background: var(--color-primary-strong);
  color: var(--color-on-primary);
}

.notice {
  margin: var(--space-3) 0 0;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: var(--line-height-standard);
}
</style>
