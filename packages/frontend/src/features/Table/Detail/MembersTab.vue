<script setup lang="ts">
import MemberDisplay from '@/features/Lobby/Detail/MemberDisplay.vue';
import SeatDisplay from '@/features/GameSession/Detail/SeatDisplay.vue';
import type { LobbyDetailModel, LobbyEntryModel } from '@/models/lobby';
import type { GameSessionDetailModel, SeatModel } from '@/models/game-session';

defineProps<{
  lobby: LobbyDetailModel;
  gameSession: GameSessionDetailModel | null;
  /** 着席候補の母集団。ロビーの在籍者 */
  activeEntries: LobbyEntryModel[];
}>();

const emit = defineEmits<{
  'member-removed': [memberId: string];
  'seat-updated': [updated: SeatModel];
  'seat-added': [seat: SeatModel];
  'seat-removed': [seatId: string];
}>();
</script>

<template>
  <div class="members">
    <!--
      確定日に参加できない人も卓のメンバーには残る（#147）。
      着席（当日いる人）は開催が生まれてから別に並べる。
    -->
    <MemberDisplay
      :lobby="lobby"
      @member-removed="emit('member-removed', $event)"
    />
    <SeatDisplay
      v-if="gameSession"
      :game-session="gameSession"
      :active-entries="activeEntries"
      @seat-updated="emit('seat-updated', $event)"
      @seat-added="emit('seat-added', $event)"
      @seat-removed="emit('seat-removed', $event)"
    />
  </div>
</template>

<style scoped>
.members {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
