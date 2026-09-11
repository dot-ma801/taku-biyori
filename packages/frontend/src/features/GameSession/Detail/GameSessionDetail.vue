<script setup lang="ts">
defineOptions({ name: 'GameSessionDetail' });

import { computed, getCurrentInstance, onUnmounted, ref, watch } from 'vue';
import BaseBreadcrumb from '@/components/common/BaseBreadcrumb/BaseBreadcrumb.vue';
import BaseTabs from '@/components/common/BaseTabs/BaseTabs.vue';
import BaseAlert from '@/components/common/BaseAlert/BaseAlert.vue';
import ActionBar from '@/features/Lobby/Detail/ActionBar.vue';
import SessionActionBar from '@/features/GameSession/Detail/SessionActionBar.vue';
import ScheduleTab from '@/features/GameSession/Detail/ScheduleTab.vue';
import GameSessionDetailHeader from '@/features/GameSession/Detail/GameSessionDetailHeader.vue';
import OverviewTab from '@/features/GameSession/Detail/OverviewTab.vue';
import MembersTab from '@/features/GameSession/Detail/MembersTab.vue';
import PlayMemoTab from '@/features/GameSession/Detail/PlayMemoTab.vue';
import { useGameSessionDetailPage } from '@/features/GameSession/Detail/useGameSessionDetailPage';
import { resolveGameSessionRole } from '@/features/GameSession/Detail/useGameSessionDetailPage';
import {
  GameSessionDetailTab,
  useGameSessionDetailTabs,
} from '@/features/GameSession/Detail/useGameSessionDetailTabs';
import { useGetGameSessionDetail } from '@/features/GameSession/Detail/useGetGameSessionDetail';
import { useSession } from '@/lib/auth';
import { PAGE_NAME } from '@/config/pageName';

const props = defineProps<{
  lobbyId: string;
  /**
   * URL が名指ししている開催。開催の URL から来たときに渡る。
   * 指定があればそれを見せる（代表の開催で上書きしない）。
   */
  gameSessionId?: string;
  /** 特定の開催から来たときに開くタブ。URL 直リンク用 */
  initialTab?: string;
}>();

const {
  lobby,
  status,
  gameSessionId: representativeGameSessionId,
  hasPendingSchedulePoll,
  loading,
  errorMessage,
  activeEntryCount,
  fetch,
  patchLobby,
  addEntry,
  removeEntry,
} = useGameSessionDetailPage(props.lobbyId);

/**
 * 見せる開催。
 *
 * URL が開催を名指ししているなら必ずそれを出す。ブックマークや編集後の戻り先が
 * 別の開催（代表に選ばれたほう）にすり替わらないようにするため。
 * 名指しが無いときだけ、代表の開催を出す。
 */
const gameSessionId = computed(
  () => props.gameSessionId ?? representativeGameSessionId.value,
);

// 代表になる開催は、ロビー配下の一覧を取ってから決まる。
// そのため id は getter で渡し、決まった時点で詳細を取りに行かせる
const {
  gameSession,
  loading: loadingGameSession,
  errorMessage: gameSessionErrorMessage,
  fetch: fetchGameSession,
  addSeat,
  removeSeat,
  updateSeat,
} = useGetGameSessionDetail(props.lobbyId, () => gameSessionId.value);

/**
 * 着席候補はロビーの在籍者（design-v2 §6-6）。
 * この画面はロビー詳細を自分で持っているので、別に取り直さず**同じ状態を使う**。
 * 取り直すと、メンバーを取り消した直後に「着席させる」の候補へ残ってしまう。
 */
const activeEntries = computed(() => lobby.value?.activeEntries ?? []);

// useSession は nanostores の Atom なので Vue の ref に変換する
const sessionData = ref(useSession.get());
const unsubscribeSession = useSession.subscribe((v) => {
  sessionData.value = v;
});
if (getCurrentInstance()) {
  onUnmounted(unsubscribeSession);
}
const myUserId = computed(() => sessionData.value.data?.user?.id ?? null);

const role = computed(() =>
  resolveGameSessionRole(lobby.value, myUserId.value),
);
const hasGameSession = computed(() => gameSessionId.value !== null);

const { tabs, resolveActiveTab } = useGameSessionDetailTabs(
  status,
  role,
  hasGameSession,
  hasPendingSchedulePoll,
);

const activeTab = ref<string>(
  props.initialTab ?? GameSessionDetailTab.overview,
);

// 状態やロールが変わるとタブが増減する。いま開いているタブが消えたら概要に戻す
watch(tabs, () => {
  activeTab.value = resolveActiveTab(activeTab.value);
});

const isHost = computed(() => role.value === 'host');

// URL を入れ子にしたぶん（design-v2 §7-1）、階層を辿る導線を画面にも置く
const breadcrumbItems = computed(() => [
  { label: 'ダッシュボード', to: { name: PAGE_NAME.dashboard } },
  { label: '卓', to: { name: PAGE_NAME.gameSessions } },
  { label: lobby.value?.title ?? '卓' },
]);

/**
 * 日程を確定した・中止したなど、卓の状態が動いたあとの取り直し。
 * どの開催を代表にするかが変わりうるので、ロビー・開催一覧・開催詳細を揃え直す。
 */
async function refreshAll() {
  await fetch();
  await fetchGameSession();
}

/**
 * 開催の詳細だけが取れなかったときの知らせ。
 *
 * ロビーは表示できるので画面ごと落とさない。ただし黙って落とすと
 * 「プレイメモがまだありません」のように**取得できていないことを
 * 存在しないことと取り違えて**見せてしまうため、帯で伝える。
 */
const showGameSessionError = computed(
  () => gameSessionErrorMessage.value !== '' && !loadingGameSession.value,
);
</script>

<template>
  <div v-if="loading && !lobby" class="table-detail__status">読み込み中...</div>
  <div v-else-if="errorMessage" class="table-detail__status">
    {{ errorMessage }}
  </div>

  <div v-else-if="lobby" class="table-detail">
    <BaseBreadcrumb :items="breadcrumbItems" />

    <div class="table-detail__top">
      <GameSessionDetailHeader
        :lobby="lobby"
        :game-session="gameSession"
        :status="status"
        :role="role"
      />

      <div class="table-detail__actions">
        <!--
          参加・退出・招待リンクなどロビーの操作。**全員に出す。**
          出せる操作の判定は ActionBar が内部で持っているので、ここで
          ホストに絞ると参加者・未参加者から参加／退出の導線が消えてしまう。
        -->
        <ActionBar
          :lobby="lobby"
          @updated="patchLobby"
          @member-added="addEntry"
          @member-removed="removeEntry"
        />
        <!--
          開催そのものの操作（完了・中止・削除）はホストだけ（#152）。
          key を付けて、見せる開催が入れ替わったら作り直す。中の
          useGameSessionStatus は id を setup 時の文字列で捕まえるため、
          使い回すと操作が前の開催へ飛ぶ。
        -->
        <SessionActionBar
          v-if="isHost && gameSessionId"
          :key="gameSessionId"
          :lobby-id="props.lobbyId"
          :game-session-id="gameSessionId"
          :game-session="gameSession"
          @session-changed="refreshAll"
        />
      </div>
    </div>

    <BaseAlert v-if="showGameSessionError" variant="error">
      開催の情報を取得できませんでした。{{ gameSessionErrorMessage }}
    </BaseAlert>

    <BaseTabs v-model="activeTab" :tabs="tabs" label="卓の内容">
      <template #[GameSessionDetailTab.overview]>
        <OverviewTab
          :lobby="lobby"
          :game-session="gameSession"
          :active-entry-count="activeEntryCount"
        />
      </template>

      <template #[GameSessionDetailTab.schedule]>
        <!-- 確定しても画面は変えない。この場で「調整中 → 開催予定」に切り替わる -->
        <ScheduleTab
          :lobby="lobby"
          :is-host="isHost"
          :has-pending-schedule-poll="hasPendingSchedulePoll"
          @changed="refreshAll"
        />
      </template>

      <template #[GameSessionDetailTab.members]>
        <MembersTab
          :lobby="lobby"
          :game-session="gameSession"
          :active-entries="activeEntries"
          @member-removed="removeEntry"
          @seat-updated="updateSeat"
          @seat-added="addSeat"
          @seat-removed="removeSeat"
        />
      </template>

      <template #[GameSessionDetailTab.playMemo]>
        <PlayMemoTab :game-session="gameSession" />
      </template>
    </BaseTabs>
  </div>
</template>

<style scoped>
.table-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.table-detail__status {
  padding: var(--space-8) 0;
  text-align: center;
  font: var(--text-body-sm);
  color: var(--text-secondary);
}

.table-detail__top {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5);
  align-items: flex-start;
}

.table-detail__top > :first-child {
  flex: 1 1 380px;
  min-width: 0;
}

.table-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: flex-start;
}
</style>
