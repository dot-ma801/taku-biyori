<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import PageContainer from '@/components/layout/PageContainer/PageContainer.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import PlayMemoEditor from '@/features/GameSession/PlayMemo/PlayMemoEditor.vue';
import PlayMemoReader from '@/features/GameSession/PlayMemo/PlayMemoReader.vue';
import PlayMemoSidebar from '@/features/GameSession/PlayMemo/PlayMemoSidebar.vue';
import { useGetGameSessionDetail } from '@/features/GameSession/Detail/useGetGameSessionDetail';
import { useMyPlayMemo } from '@/features/GameSession/PlayMemo/useMyPlayMemo';
import { usePlayMemoPane } from '@/features/GameSession/PlayMemo/usePlayMemoPane';
import { usePlayMemoSelection } from '@/features/GameSession/PlayMemo/usePlayMemoSelection';
import { useSharedPlayMemos } from '@/features/GameSession/PlayMemo/useSharedPlayMemos';
import { useAuthStore } from '@/stores/auth';

const props = defineProps<{ lobbyId: string; gameSessionId: string }>();

const router = useRouter();
const authStore = useAuthStore();

const {
  gameSession,
  loading: loadingDetail,
  errorMessage,
} = useGetGameSessionDetail(props.lobbyId, props.gameSessionId);

const {
  playMemo,
  loading: loadingMemo,
  myMember,
  isMyMemo,
  canEditBody,
  isShared,
  canToggleVisibility,
  visibilityStatus,
  setShared,
  fetch: fetchPlayMemo,
  applySaved,
} = useMyPlayMemo(props.lobbyId, props.gameSessionId, () => gameSession.value);

const {
  canViewShared,
  entries,
  loading: loadingSharedPlayMemos,
  fetch: fetchSharedPlayMemos,
} = useSharedPlayMemos(
  props.lobbyId,
  props.gameSessionId,
  () => gameSession.value,
  () => myMember.value?.id ?? null,
);

const { selectedEntry, selectedSeatId, isMineSelected, select } =
  usePlayMemoSelection(entries);

const gameSessionTitle = computed(() => gameSession.value?.title ?? '');

/**
 * 「何を出すか」の導出は usePlayMemoPane に集約する（CLAUDE.md「データの
 * 導出は composable に寄せる」）。ローディング境界・失敗時の表示範囲は
 * この composable のユニットテストで固定している。
 */
const { showSidebar, showEditor, showFailedNotice, readerEntry, showLoading } =
  usePlayMemoPane({
    loadingMemo,
    loadingSharedPlayMemos,
    isMyMemo,
    playMemo,
    canViewShared,
    selectedEntry,
    isMineSelected,
  });

// メモを持てず、公開メモも読めない相手がこの URL を直接開いたケース
// （実施前の卓を非メンバーが開いた・退出後など）。履歴を汚さないよう
// replace で卓詳細へ戻す。
//
// 完了・中止した卓の公開メモは未ログイン・ゲストにも開くため（要求 §3-4）、
// 判定はメンバーかどうかだけでは足りない。canViewShared も見て、読む目的で
// 来た相手を追い返さないようにする。
//
// ルートから requiresAuth を外したのでガードはセッション復元を待たない。
// 待たずに判定すると「復元前 → currentUser が null → isMyMemo false」で
// メンバーが弾かれるため、ここで復元の完了を待つ。isMyMemo も watch の
// ソースに含め、members が後から差し替わっても再評価されるようにする。
watch(
  () => ({
    loading: loadingDetail.value,
    session: gameSession.value,
    isMine: isMyMemo.value,
    canView: canViewShared.value,
  }),
  async ({ loading, session, canView }) => {
    if (loading || !session || canView) return;
    await authStore.ensureSessionReady();
    if (isMyMemo.value) return;
    void router.replace({
      name: 'game-sessions-detail',
      params: {
        lobbyId: props.lobbyId,
        gameSessionId: props.gameSessionId,
      },
    });
  },
);

/**
 * 公開状態を切り替える。
 * 一覧（サイドバーのタグ・公開件数）も変わるため、続けて取り直す。
 *
 * `setShared` が返すのは「実際に PATCH を送ったか」。二重送信ガードや
 * 切替不可で早期 return したときは false が返るため、その場合は
 * 一覧を取り直さない（送っていないのに取り直すと、まだ処理中の前の
 * PATCH と競合して一覧が巻き戻り得るため）。
 */
async function onVisibilityChange(shared: boolean) {
  const sent = await setShared(shared);
  if (!sent) return;
  await fetchSharedPlayMemos();
}
</script>

<template>
  <PageContainer>
    <div v-if="errorMessage">{{ errorMessage }}</div>

    <div
      v-else-if="gameSession"
      class="layout"
      :class="{ 'layout--with-sidebar': showSidebar }"
    >
      <!--
        自分のメモの取得失敗は、この枠（本来エディタが出る場所）の中だけに
        閉じ込める。完了・中止した卓では他メンバーの公開メモを読むことが
        この画面のもう1つの主目的で、それは自分のメモの取得可否とは独立
        （要求 §3-3・§3-4）なので、サイドバーや閲覧面まで道連れにしない。
      -->
      <PlayMemoSidebar
        v-if="showSidebar"
        :entries="entries"
        :selected-seat-id="selectedSeatId"
        @select="select"
      />

      <PlayMemoEditor
        v-if="showEditor"
        :lobby-id="props.lobbyId"
        :game-session-id="props.gameSessionId"
        :game-session-title="gameSessionTitle"
        :play-memo="playMemo"
        :can-edit-body="canEditBody"
        :is-shared="isShared"
        :can-toggle-visibility="canToggleVisibility"
        :visibility-status="visibilityStatus"
        @saved="applySaved"
        @visibility-change="onVisibilityChange"
      />

      <div v-else-if="showFailedNotice" class="failed">
        <p class="failed__text">メモを読み込めませんでした。</p>
        <BaseButton variant="secondary" @click="fetchPlayMemo">
          再読み込み
        </BaseButton>
      </div>

      <PlayMemoReader
        v-else-if="readerEntry"
        :game-session-id="props.gameSessionId"
        :game-session-title="gameSessionTitle"
        :entry="readerEntry"
      />

      <p v-else-if="showLoading" class="empty">読み込み中...</p>

      <BaseCard v-else>
        <p class="empty">公開されているプレイメモはまだありません。</p>
      </BaseCard>
    </div>

    <div v-else>読み込み中...</div>
  </PageContainer>
</template>

<style scoped>
.layout {
  display: grid;
  gap: var(--space-4);
  align-items: start;
}

.layout--with-sidebar {
  grid-template-columns: 220px minmax(0, 1fr);
}

@media (max-width: 780px) {
  .layout--with-sidebar {
    grid-template-columns: minmax(0, 1fr);
  }
}

.failed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6) var(--space-3);
}

.failed__text {
  margin: 0;
  color: var(--color-text-secondary);
}

.empty {
  margin: 0;
  padding: var(--space-6) var(--space-3);

  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: center;
}
</style>
