<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { NotebookPen, Lock, Eye, ArrowRight } from '@lucide/vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import type { MyGameSessionPlayMemo } from '@taku-biyori/shared';
import { formatDateTimeShort } from '@/utils/date';

const props = defineProps<{
  gameSessionId: string;
  playMemo: MyGameSessionPlayMemo | null;
  canEditBody: boolean;
  /** 他メンバーの公開メモを読めるステータスか（完了・中止） */
  canViewShared: boolean;
  /** 自分を除いた公開メモの件数 */
  othersSharedCount: number;
}>();

// 公開状態はサーバ値（shared_at の有無）から導く。
// 切り替えの UI はメモ画面側に置き、ここでは状態だけを見せる。
const isShared = computed(() => !!props.playMemo?.sharedAt);
const visibilityLabel = computed(() => (isShared.value ? '公開中' : '非公開'));
const visibilityIcon = computed(() => (isShared.value ? Eye : Lock));

const body = computed(() => props.playMemo?.body ?? '');
const hasBody = computed(() => body.value.length > 0);

/**
 * 本文の要約行。全文はメモ画面で読むので、ここは固定行数で切るだけにする
 * （長文でも卓詳細の縦丈が一定に保たれる）。
 */
const summary = computed(() => {
  if (!hasBody.value) return '';
  return `${body.value.length.toLocaleString()} 字`;
});

const updatedLabel = computed(() => {
  const updatedAt = props.playMemo?.updatedAt;
  if (!updatedAt) return '';
  return `${formatDateTimeShort(updatedAt)} に保存`;
});

const metaLabel = computed(() =>
  [summary.value, updatedLabel.value].filter(Boolean).join('・'),
);

const memoRoute = computed(() => ({
  name: 'game-sessions-play-memo',
  params: { gameSessionId: props.gameSessionId },
}));

/**
 * 遷移先は読み書き兼用の画面なので、完了・中止後もリンクは残す
 * （本文は編集できないが、読み返しと公開の切り替えはできる）。
 */
const openLabel = computed(() => {
  if (!props.canEditBody) return '開く';
  return hasBody.value ? '書く' : '最初のメモを書く';
});

/**
 * 他メンバーの公開メモの件数を伝える一行。
 *
 * 一覧はここに置かず、読む場所はメモ画面に集約する（design-v1.2 §8）。
 * 読めない時期（完了・中止の前）は件数そのものを出さない。
 */
const sharedCountLabel = computed(() => {
  if (!props.canViewShared) return '';
  if (props.othersSharedCount === 0) {
    return 'ほかのメンバーの公開メモはまだありません。';
  }
  return `ほかのメンバーの公開メモが ${props.othersSharedCount} 件あります。`;
});

// 完了・中止で本文が閉じることを、閉じる前から伝える（要求 §4）。
// カードは入口なので案内は控えめに置き、強い警告はメモ画面側で出す。
const notice = computed(() =>
  props.canEditBody
    ? '卓が完了・中止すると、本文は編集できなくなります（公開・非公開の切り替えは引き続き行えます）。'
    : '卓が完了したため本文は編集できません。公開・非公開の切り替えは引き続き行えます。',
);
</script>

<template>
  <BaseCard>
    <div class="heading-row">
      <BaseSectionHeading level="h3" :icon="NotebookPen">
        プレイメモ
      </BaseSectionHeading>
      <span class="visibility" :class="{ 'visibility--shared': isShared }">
        <component :is="visibilityIcon" :size="12" aria-hidden="true" />
        {{ visibilityLabel }}
      </span>
    </div>

    <p v-if="hasBody" class="body">{{ body }}</p>
    <p v-else class="empty">プレイ中の気づきを、自分だけのメモに残せます。</p>

    <p v-if="sharedCountLabel" class="shared-count">{{ sharedCountLabel }}</p>

    <div class="foot">
      <span class="meta">{{ metaLabel }}</span>
      <RouterLink :to="memoRoute" class="open-link">
        {{ openLabel }}
        <ArrowRight :size="15" aria-hidden="true" />
      </RouterLink>
    </div>

    <p class="notice">{{ notice }}</p>
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

.visibility--shared {
  border-color: var(--color-success);
  background: var(--color-success-soft);
  color: var(--color-success);
}

.body {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;

  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}

.empty {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.shared-count {
  margin: var(--space-3) 0 0;
  color: var(--color-text-secondary);
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

.open-link {
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

.open-link:hover {
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
