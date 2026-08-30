<script setup lang="ts">
defineOptions({ name: 'AppDashboard' });
import GameSessionList from '@/features/GameSession/List/index.vue';
import LobbyList from '@/features/Lobby/List/index.vue';
import { LobbyStatus, GameSessionStatus } from '@taku-biyori/shared';
</script>

<template>
  <div class="dashboard">
    <LobbyList
      title="受付中・調整中"
      :statuses="[LobbyStatus.open, LobbyStatus.closed]"
    />
    <GameSessionList
      title="開催予定"
      :statuses="[GameSessionStatus.scheduled, GameSessionStatus.today]"
      sort-by-scheduled-at
    />
    <!-- 非公開のロビー・卓はここからしか辿れないため、下書きが残っているときだけ表示する -->
    <LobbyList
      title="非公開のロビー"
      :statuses="[LobbyStatus.draft]"
      hide-when-empty
      hide-create-button
    />
    <!--
      履歴。他人の終了した卓は出しても仕方がないので自分の分だけに絞る。
      件数が増えて一覧が重くなったら専用ページへ切り出す。
    -->
    <GameSessionList
      title="終えた開催"
      :statuses="[GameSessionStatus.completed, GameSessionStatus.cancelled]"
      hide-when-empty
      hide-public
    />
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
</style>
