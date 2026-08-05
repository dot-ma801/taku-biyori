<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowRight, NotebookPen } from '@lucide/vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import MyPlayMemoCard from '@/features/GameSession/PlayMemo/MyPlayMemoCard.vue';
import { useMyPlayMemo } from '@/features/GameSession/PlayMemo/useMyPlayMemo';
import { useSharedPlayMemos } from '@/features/GameSession/PlayMemo/useSharedPlayMemos';
import type { GameSessionDetail } from '@taku-biyori/shared';

const props = defineProps<{
  gameSession: GameSessionDetail;
}>();

const { playMemo, myMember, isMyMemo, showLoginPrompt, canEditBody } =
  useMyPlayMemo(props.gameSession.id, () => props.gameSession);

const { canViewShared, sharedEntries, othersSharedCount } = useSharedPlayMemos(
  props.gameSession.id,
  () => props.gameSession,
  () => myMember.value?.id ?? null,
);

/**
 * メンバーでない相手にも読む導線を出すか。
 *
 * 完了・中止した卓の公開メモは未ログイン・ゲストも読めるため（要求 §3-4）、
 * 書けないことだけを伝えて終わらせない。1件も無いときは出さない。
 */
const showReadEntry = computed(
  () => canViewShared.value && othersSharedCount.value > 0,
);

const readEntryLabel = computed(
  () => `公開されたプレイメモが ${othersSharedCount.value} 件あります。`,
);

const memoRoute = computed(() => ({
  name: 'game-sessions-play-memo',
  params: { gameSessionId: props.gameSession.id },
}));
</script>

<template>
  <MyPlayMemoCard
    v-if="isMyMemo"
    :game-session-id="props.gameSession.id"
    :play-memo="playMemo"
    :can-edit-body="canEditBody"
    :can-view-shared="canViewShared"
    :shared-entries="sharedEntries"
  />

  <!--
    メンバー以外の枠。読む導線（公開メモがある完了・中止の卓）と、
    書くためのログイン導線（未ログイン・ゲスト）のどちらかがあれば出す。
    ログイン済みの非メンバーで読むものも無ければセクションごと出さない。
  -->
  <BaseCard v-else-if="showReadEntry || showLoginPrompt">
    <BaseSectionHeading level="h3" :icon="NotebookPen">
      プレイメモ
    </BaseSectionHeading>

    <div v-if="showReadEntry" class="read">
      <p class="read__text">{{ readEntryLabel }}</p>
      <RouterLink :to="memoRoute" class="read__link">
        公開メモを読む
        <ArrowRight :size="15" aria-hidden="true" />
      </RouterLink>
    </div>

    <div v-if="showLoginPrompt" class="prompt">
      <p class="prompt__text">
        メモを書けるのは、ログインしているメンバーだけです
      </p>
      <RouterLink :to="{ name: 'login' }" class="prompt__link">
        ログインする
      </RouterLink>
    </div>
  </BaseCard>
</template>

<style scoped>
.read {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.read__text {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.read__link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-4);

  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-on-primary);

  font-size: var(--font-size-sm);
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
}

.read__link:hover {
  background: var(--color-primary-strong);
  color: var(--color-on-primary);
}

.prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);

  margin-top: var(--space-3);
  padding: var(--space-4) var(--space-2);
  text-align: center;
}

.prompt__text {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.prompt__link {
  font-size: var(--font-size-sm);
  font-weight: 500;
  text-decoration: underline;
}
</style>
