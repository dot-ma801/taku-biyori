<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowLeft, Eye, Lock } from '@lucide/vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import type {
  PlayMemoMemberEntry,
  PlayMemoMemberTag,
} from '@/features/GameSession/PlayMemo/useSharedPlayMemos';
import { formatDateTimeShort } from '@/utils/date';

const props = defineProps<{
  gameSessionId: string;
  gameSessionTitle: string;
  entry: PlayMemoMemberEntry;
}>();

const isReadable = computed(() => props.entry.readable);
const headIcon = computed(() => (isReadable.value ? Eye : Lock));

const body = computed(() => props.entry.sharedPlayMemo?.body ?? '');
const hasBody = computed(() => body.value.length > 0);

const sharedAtLabel = computed(() => {
  const sharedAt = props.entry.sharedPlayMemo?.sharedAt;
  if (!sharedAt) return '';
  return `${formatDateTimeShort(sharedAt)} に公開`;
});

/**
 * 読めない理由。押した結果として本文の場所に出す。
 *
 * 読めないのは「非公開」「ゲスト」の2つだけ（公開されていれば読める）。
 * 禁止ではなく仕様上の帰結として書く（design-v1.2 §6 のタグ語彙と同じ方針）。
 */
const UNREADABLE_TITLES: Record<PlayMemoMemberTag, string> = {
  shared: '',
  private: 'このメモは公開されていません',
  guest: 'ゲストのメンバーはプレイメモを持てません',
};

const UNREADABLE_DESCRIPTIONS: Record<PlayMemoMemberTag, string> = {
  shared: '',
  private: '公開されると、ここで読めるようになります。',
  guest: 'プレイメモはログインユーザー限定の機能です。',
};

const unreadableTitle = computed(() => UNREADABLE_TITLES[props.entry.tag]);
const unreadableDescription = computed(
  () => UNREADABLE_DESCRIPTIONS[props.entry.tag],
);

const detailRoute = computed(() => ({
  name: 'game-sessions-detail',
  params: { gameSessionId: props.gameSessionId },
}));
</script>

<template>
  <BaseCard>
    <div class="head">
      <RouterLink :to="detailRoute" class="back" aria-label="卓の詳細へ戻る">
        <ArrowLeft :size="18" aria-hidden="true" />
      </RouterLink>
      <component
        :is="headIcon"
        :size="18"
        class="head__icon"
        aria-hidden="true"
      />
      <div class="head__titles">
        <p class="head__title">{{ props.entry.primaryLabel }}</p>
        <p v-if="props.entry.secondaryLabel" class="head__subtitle">
          {{ props.entry.secondaryLabel }}
        </p>
      </div>
      <span class="head__session">{{ props.gameSessionTitle }}</span>
    </div>

    <div v-if="!isReadable" class="unreadable">
      <Lock :size="20" class="unreadable__icon" aria-hidden="true" />
      <p class="unreadable__title">{{ unreadableTitle }}</p>
      <p class="unreadable__description">{{ unreadableDescription }}</p>
    </div>

    <p v-else-if="hasBody" class="body">{{ body }}</p>
    <p v-else class="empty">このメモには本文がありません。</p>

    <div class="foot">
      <span class="meta">{{ sharedAtLabel }}</span>
      <RouterLink :to="detailRoute" class="foot__back">卓へ戻る</RouterLink>
    </div>
  </BaseCard>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.back {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
}

.back:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.head__icon {
  flex-shrink: 0;
  color: var(--color-primary-text);
}

.head__titles {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  /* メンバー名は長さが読めないので、はみ出す前にこの箱の中で削る */
  flex: 1;
  min-width: 0;
}

.head__title {
  margin: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 18px;
  font-weight: 500;
}

.head__subtitle {
  margin: 0;
  /* 主ラベル（キャラ名）より先に潰さない。長すぎるときだけこの幅で省略する */
  flex-shrink: 0;
  max-width: 30%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-muted);
  font-size: 12px;
}

.head__session {
  margin-left: auto;
  max-width: 40%;
  color: var(--color-text-muted);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 狭い画面では横に並べきれないので縦に積み、それぞれ1行で省略する */
@media (max-width: 600px) {
  .head {
    flex-wrap: wrap;
  }

  .head__titles {
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
  }

  .head__subtitle {
    max-width: 100%;
  }

  .head__session {
    flex-basis: 100%;
    max-width: 100%;
    margin-left: 0;
  }
}

.body {
  margin: 0;
  padding: var(--space-3);
  min-height: 40vh;

  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}

.empty {
  margin: 0;
  padding: var(--space-6) var(--space-3);

  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: center;
}

.unreadable {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);

  padding: var(--space-6) var(--space-4);

  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-align: center;
}

.unreadable__icon {
  color: var(--color-text-muted);
}

.unreadable__title {
  margin: 0;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.unreadable__description {
  margin: 0;
  max-width: 34em;

  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
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

.foot__back {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
</style>
