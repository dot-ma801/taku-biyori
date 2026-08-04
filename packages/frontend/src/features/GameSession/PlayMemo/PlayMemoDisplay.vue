<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { NotebookPen } from '@lucide/vue';
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

// 公開件数はカード（メンバー限定）にしか出さないため、メンバーでない間は
// 卓を渡さずに通信させない。メンバーになった時点で取得が走る
const { canViewShared, othersSharedCount } = useSharedPlayMemos(
  props.gameSession.id,
  () => (isMyMemo.value ? props.gameSession : null),
  () => myMember.value?.id ?? null,
);
</script>

<template>
  <MyPlayMemoCard
    v-if="isMyMemo"
    :game-session-id="props.gameSession.id"
    :play-memo="playMemo"
    :can-edit-body="canEditBody"
    :can-view-shared="canViewShared"
    :others-shared-count="othersSharedCount"
  />

  <!-- 未ログイン・ゲスト。ログイン済みの非メンバーには何も出さない -->
  <BaseCard v-else-if="showLoginPrompt">
    <BaseSectionHeading level="h3" :icon="NotebookPen">
      プレイメモ
    </BaseSectionHeading>
    <div class="prompt">
      <p class="prompt__text">メモ機能はログインユーザー限定です</p>
      <RouterLink :to="{ name: 'login' }" class="prompt__link">
        ログインする
      </RouterLink>
    </div>
  </BaseCard>
</template>

<style scoped>
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
