<script setup lang="ts">
defineOptions({ name: 'TableDetail' });

import { computed, getCurrentInstance, onUnmounted, ref, watch } from 'vue';
import BaseBreadcrumb from '@/components/common/BaseBreadcrumb/BaseBreadcrumb.vue';
import BaseTabs from '@/components/common/BaseTabs/BaseTabs.vue';
import ActionBar from '@/features/Lobby/Detail/ActionBar.vue';
import SessionActionBar from '@/features/GameSession/Detail/SessionActionBar.vue';
import ScheduleTab from '@/features/Table/Detail/ScheduleTab.vue';
import TableDetailHeader from '@/features/Table/Detail/TableDetailHeader.vue';
import OverviewTab from '@/features/Table/Detail/OverviewTab.vue';
import MembersTab from '@/features/Table/Detail/MembersTab.vue';
import PlayMemoTab from '@/features/Table/Detail/PlayMemoTab.vue';
import { useTableDetail } from '@/features/Table/Detail/useTableDetail';
import { resolveTableRole } from '@/features/Table/Detail/useTableDetail';
import {
  TableDetailTab,
  useTableDetailTabs,
} from '@/features/Table/Detail/useTableDetailTabs';
import { useGetGameSessionDetail } from '@/features/GameSession/Detail/useGetGameSessionDetail';
import { useLobbyEntriesForSeating } from '@/features/GameSession/Detail/useLobbyEntriesForSeating';
import { useSession } from '@/lib/auth';

const props = defineProps<{
  lobbyId: string;
  /** 特定の開催から来たときに開くタブ。URL 直リンク用 */
  initialTab?: string;
}>();

const {
  lobby,
  status,
  gameSessionId,
  loading,
  errorMessage,
  activeEntryCount,
  fetch,
  patchLobby,
  addEntry,
  removeEntry,
} = useTableDetail(props.lobbyId);

// 代表になる開催は、ロビー配下の一覧を取ってから決まる。
// そのため id は getter で渡し、決まった時点で詳細を取りに行かせる
const {
  gameSession,
  fetch: fetchGameSession,
  addSeat,
  removeSeat,
  updateSeat,
} = useGetGameSessionDetail(props.lobbyId, () => gameSessionId.value);

// 着席候補はロビーの在籍者。ホストが着席させるときだけ要る（design-v2 §6-6）
const { activeEntries } = useLobbyEntriesForSeating(
  props.lobbyId,
  () => lobby.value?.hostUserId,
);

// useSession は nanostores の Atom なので Vue の ref に変換する
const sessionData = ref(useSession.get());
const unsubscribeSession = useSession.subscribe((v) => {
  sessionData.value = v;
});
if (getCurrentInstance()) {
  onUnmounted(unsubscribeSession);
}
const myUserId = computed(() => sessionData.value.data?.user?.id ?? null);

const role = computed(() => resolveTableRole(lobby.value, myUserId.value));
const hasGameSession = computed(() => gameSessionId.value !== null);

const { tabs, resolveActiveTab } = useTableDetailTabs(
  status,
  role,
  hasGameSession,
);

const activeTab = ref<string>(props.initialTab ?? TableDetailTab.overview);

// 状態やロールが変わるとタブが増減する。いま開いているタブが消えたら概要に戻す
watch(tabs, () => {
  activeTab.value = resolveActiveTab(activeTab.value);
});

const isHost = computed(() => role.value === 'host');

// URL を入れ子にしたぶん（design-v2 §7-1）、階層を辿る導線を画面にも置く
const breadcrumbItems = computed(() => [
  { label: 'ダッシュボード', to: { name: 'dashboard' } },
  { label: '卓', to: { name: 'tables' } },
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
</script>

<template>
  <div v-if="loading && !lobby" class="table-detail__status">読み込み中...</div>
  <div v-else-if="errorMessage" class="table-detail__status">
    {{ errorMessage }}
  </div>

  <div v-else-if="lobby" class="table-detail">
    <BaseBreadcrumb :items="breadcrumbItems" />

    <div class="table-detail__top">
      <TableDetailHeader
        :lobby="lobby"
        :game-session="gameSession"
        :status="status"
        :role="role"
      />

      <!-- 編集・招待リンク・その他操作はホストだけ（#152） -->
      <div v-if="isHost" class="table-detail__actions">
        <ActionBar
          :lobby="lobby"
          @updated="patchLobby"
          @member-added="addEntry"
          @member-removed="removeEntry"
        />
        <SessionActionBar
          v-if="gameSessionId"
          :lobby-id="props.lobbyId"
          :game-session-id="gameSessionId"
          :game-session="gameSession"
          @session-changed="refreshAll"
        />
      </div>
    </div>

    <BaseTabs v-model="activeTab" :tabs="tabs" label="卓の内容">
      <template #[TableDetailTab.overview]>
        <OverviewTab
          :lobby="lobby"
          :game-session="gameSession"
          :active-entry-count="activeEntryCount"
        />
      </template>

      <template #[TableDetailTab.schedule]>
        <!-- 確定しても画面は変えない。この場で「調整中 → 開催予定」に切り替わる -->
        <ScheduleTab :lobby="lobby" :is-host="isHost" @changed="refreshAll" />
      </template>

      <template #[TableDetailTab.members]>
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

      <template #[TableDetailTab.playMemo]>
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
