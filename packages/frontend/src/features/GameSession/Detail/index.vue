<script setup lang="ts">
defineOptions({ name: 'GameSessionDetail' });
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseBreadcrumb from '@/components/common/BaseBreadcrumb/BaseBreadcrumb.vue';
import SeatDisplay from '@/features/GameSession/Detail/SeatDisplay.vue';
import MemoDisplay from '@/features/GameSession/Detail/MemoDisplay.vue';
import PlayMemoDisplay from '@/features/GameSession/PlayMemo/PlayMemoDisplay.vue';
import SessionActionBar from '@/features/GameSession/Detail/SessionActionBar.vue';
import StatusDisplay from '@/features/GameSession/Detail/StatusDisplay.vue';
import { useGetGameSessionDetail } from '@/features/GameSession/Detail/useGetGameSessionDetail';
import { useLobbyEntriesForSeating } from '@/features/GameSession/Detail/useLobbyEntriesForSeating';
import { computed } from 'vue';
import { Album, UsersRound, CalendarDays, Clock, MapPin } from '@lucide/vue';
import { GameSessionStatus } from '@taku-biyori/shared';

const props = defineProps<{ lobbyId: string; gameSessionId: string }>();

const {
  gameSession,
  loading: loadingDetail,
  errorMessage,
  fetch,
  addSeat,
  removeSeat,
  updateSeat,
} = useGetGameSessionDetail(props.lobbyId, props.gameSessionId);

// 着席候補はロビーの在籍者。ホストが着席させるときだけ要る（design-v2 §6-6）
const { activeEntries } = useLobbyEntriesForSeating(
  props.lobbyId,
  () => gameSession.value?.lobby.hostUserId,
);

// 表示用のフォールバック文言は UI の関心事なのでここに置く。
// 値そのものは model が解決済み（overrides ?? lobby）なので ?? は書かない
const scenarioName = computed(
  () => gameSession.value?.scenarioName ?? '未設定',
);
const maxPlayers = computed(
  () => gameSession.value?.lobby.maxPlayers ?? '未設定',
);
const description = computed(() => gameSession.value?.description ?? undefined);
const scheduledAt = computed(() => gameSession.value?.scheduledAt ?? '未設定');
const timeLabel = computed(() => gameSession.value?.timeLabel ?? '未設定');
const location = computed(() => gameSession.value?.location ?? '未設定');

// 当日はプレイ中に何度もメモを開き直すため、備考より上（ステータスの直下）に置く。
// それ以外の日は書く頻度が低いので、開催の情報を先に読ませる並びに戻す。
const isToday = computed(
  () => gameSession.value?.status === GameSessionStatus.today,
);

// URL を入れ子にしたぶん（design-v2 §7-1）、階層を辿る導線を画面にも置く
const breadcrumbItems = computed(() => [
  { label: 'ダッシュボード', to: { name: 'dashboard' } },
  {
    label: gameSession.value?.lobby.title ?? 'ロビー',
    to: { name: 'lobbies-detail', params: { lobbyId: props.lobbyId } },
  },
  { label: gameSession.value?.title ?? '開催' },
]);
</script>

<template>
  <div v-if="loadingDetail">読み込み中...</div>
  <div v-else-if="errorMessage">{{ errorMessage }}</div>

  <div v-else-if="gameSession" class="container">
    <div>
      <BaseBreadcrumb class="breadcrumb" :items="breadcrumbItems" />

      <BaseSectionHeading level="h1">
        {{ gameSession.title }}
      </BaseSectionHeading>

      <div class="session-meta-bar">
        <div class="description">
          <Album :size="16" />
          <p>シナリオ：{{ scenarioName }}</p>
          <CalendarDays :size="16" />
          <p>開催日：{{ scheduledAt }}</p>
          <Clock :size="16" />
          <p>時間帯：{{ timeLabel }}</p>
          <UsersRound :size="16" />
          <p>定員の目安：{{ maxPlayers }}</p>
          <MapPin :size="16" />
          <p>場所：{{ location }}</p>
        </div>

        <div class="action-bar-wrapper">
          <SessionActionBar
            :lobby-id="props.lobbyId"
            :game-session-id="props.gameSessionId"
            :game-session="gameSession"
            @session-changed="fetch"
          />
        </div>
      </div>
    </div>

    <!-- TODO: シナリオ詳細文が実装されたら表示する -->
    <StatusDisplay :game-session-status="gameSession.status" />
    <PlayMemoDisplay v-if="isToday" :game-session="gameSession" />
    <MemoDisplay :text="description" />
    <PlayMemoDisplay v-if="!isToday" :game-session="gameSession" />
    <SeatDisplay
      :game-session="gameSession"
      :active-entries="activeEntries"
      @seat-updated="updateSeat"
      @seat-added="addSeat"
      @seat-removed="removeSeat"
    />
  </div>
</template>

<style scoped>
.breadcrumb {
  margin-bottom: var(--space-2);
}

.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.session-meta-bar {
  display: flex;
  justify-content: space-between;

  .description {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-auto-rows: auto;
    align-items: center;

    gap: 0 var(--space-1);
    padding-left: var(--space-3);
  }

  @media (max-width: 780px) {
    flex-direction: column;
    gap: var(--space-4) 0;

    .description {
      padding-left: 0;
    }

    .action-bar-wrapper {
      align-self: flex-end;
    }
  }
}
</style>
