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
import { usePlayMemoSelection } from '@/features/GameSession/PlayMemo/usePlayMemoSelection';
import { useSharedPlayMemos } from '@/features/GameSession/PlayMemo/useSharedPlayMemos';
import { useAuthStore } from '@/stores/auth';

const props = defineProps<{ gameSessionId: string }>();

const router = useRouter();
const authStore = useAuthStore();

const {
  gameSession,
  loading: loadingDetail,
  errorMessage,
} = useGetGameSessionDetail(props.gameSessionId);

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
} = useMyPlayMemo(props.gameSessionId, () => gameSession.value);

const {
  canViewShared,
  entries,
  hasSharedMemos,
  loading: loadingSharedPlayMemos,
  fetch: fetchSharedPlayMemos,
} = useSharedPlayMemos(
  props.gameSessionId,
  () => gameSession.value,
  () => myMember.value?.id ?? null,
);

const { selectedEntry, selectedMemberId, isMineSelected, select } =
  usePlayMemoSelection(entries);

const loading = computed(
  () =>
    loadingDetail.value || loadingMemo.value || loadingSharedPlayMemos.value,
);
const gameSessionTitle = computed(() => gameSession.value?.title ?? '');

/**
 * サイドバーを出すか。
 *
 * 完了・中止の前は他メンバーのメモが1件も返らないため、開けない項目だけが
 * 並ぶことになる。公開しているメンバーが1人も居ない場合も同じなので、
 * どちらのケースも全幅の1枚に倒す（design-v1.2 §6）。
 */
const showSidebar = computed(() => canViewShared.value && hasSharedMemos.value);

/** 自分のメモを開いているか。サイドバーを出さない時期は常に自分のメモ */
const showEditor = computed(
  () =>
    isMyMemo.value &&
    playMemo.value !== null &&
    (!showSidebar.value || isMineSelected.value),
);

/** 他メンバーの公開メモを開いているか */
const sharedEntry = computed(() => {
  if (showEditor.value) return null;
  return selectedEntry.value?.sharedPlayMemo ? selectedEntry.value : null;
});

/**
 * メンバーなのにメモを取得できなかった状態。
 * この画面はメモが主役なので、卓詳細と違って黙って閉じずに再試行を出す。
 */
const loadFailed = computed(
  () =>
    !loading.value &&
    !!gameSession.value &&
    isMyMemo.value &&
    playMemo.value === null,
);

/**
 * 開くものがまだ決まらない間。
 * これが false になっても開くものが無ければ「公開メモがまだ無い」状態。
 */
const showLoading = computed(
  () => loading.value && !showEditor.value && sharedEntry.value === null,
);

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
      params: { gameSessionId: props.gameSessionId },
    });
  },
);

/**
 * 公開状態を切り替える。
 * 一覧（サイドバーのタグ・公開件数）も変わるため、続けて取り直す。
 */
async function onVisibilityChange(shared: boolean) {
  await setShared(shared);
  await fetchSharedPlayMemos();
}
</script>

<template>
  <PageContainer>
    <div v-if="errorMessage">{{ errorMessage }}</div>

    <div v-else-if="loadFailed" class="failed">
      <p class="failed__text">メモを読み込めませんでした。</p>
      <BaseButton variant="secondary" @click="fetchPlayMemo">
        再読み込み
      </BaseButton>
    </div>

    <div
      v-else-if="gameSession"
      class="layout"
      :class="{ 'layout--with-sidebar': showSidebar }"
    >
      <PlayMemoSidebar
        v-if="showSidebar"
        :entries="entries"
        :selected-member-id="selectedMemberId"
        @select="select"
      />

      <PlayMemoEditor
        v-if="showEditor"
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

      <PlayMemoReader
        v-else-if="sharedEntry"
        :game-session-id="props.gameSessionId"
        :game-session-title="gameSessionTitle"
        :entry="sharedEntry"
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
