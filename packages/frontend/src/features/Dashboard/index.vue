<script setup lang="ts">
defineOptions({ name: 'AppDashboard' });
import GameSessionList from '@/features/GameSession/List/index.vue';
import LobbyList from '@/features/Lobby/List/index.vue';
import { LobbyStatus, GameSessionStatus } from '@taku-biyori/shared';
</script>

<template>
  <div class="dashboard">
    <!--
      design-v2 §7-5 の4セクション。開催予定を先頭に置くのは、
      直近に控えている予定が最も見たい情報だから。
    -->
    <GameSessionList
      title="開催予定"
      :statuses="[GameSessionStatus.scheduled, GameSessionStatus.today]"
      sort-by-scheduled-at
    />
    <!-- 自分が entry を持つロビーだけ。「探す」側は下の独立したセクションに出す -->
    <LobbyList
      title="参加中のロビー"
      :statuses="[LobbyStatus.open, LobbyStatus.closed]"
    />
    <!-- 下書きのロビーはここからしか辿れないため、残っているときだけ表示する -->
    <LobbyList
      title="下書きのロビー"
      :statuses="[LobbyStatus.draft]"
      hide-when-empty
      hide-create-button
    />
    <!--
      履歴。他人の終えた開催は出しても仕方がないので自分の分だけに絞る。
      件数が増えて一覧が重くなったら専用ページへ切り出す。
    -->
    <GameSessionList
      title="終えた開催"
      :statuses="[GameSessionStatus.completed, GameSessionStatus.cancelled]"
      hide-when-empty
      hide-public
    />
    <!--
      §7-5 の4セクションはすべて「自分のもの」。未参加の人がロビーを探す導線は
      関心が違うので、4セクションと混ぜず末尾に独立したセクションとして置く。
    -->
    <LobbyList scope="public" :statuses="[LobbyStatus.open]" />
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}
</style>
