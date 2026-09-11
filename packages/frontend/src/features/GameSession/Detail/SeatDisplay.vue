<script setup lang="ts">
import UserAvatar from '@/features/user/UserAvatar/UserAvatar.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import type { GameSessionDetailModel, SeatModel } from '@/models/game-session';
import { UsersRound, SquarePen, Check, UserMinus, UserPlus } from '@lucide/vue';
import type { LobbyEntryModel } from '@/models/lobby';
import { useSeatEdit } from '@/features/GameSession/Detail/useSeatEdit';
import { useSeatManagement } from '@/features/GameSession/Detail/useSeatManagement';
import { memberDisplayName, memberBaseName } from '@/utils/memberDisplayName';
import { computed } from 'vue';

const props = defineProps<{
  gameSession: GameSessionDetailModel;
  /** ロビーの在籍中の参加者。着席候補の母集団。取得前は空配列でよい */
  activeEntries?: LobbyEntryModel[];
}>();

const displaySeats = computed(() =>
  props.gameSession.seats.map((seat) => ({
    id: seat.id,
    characterName: seat.characterName,
    userName: memberDisplayName(seat),
    // アバターの種。id を持つ人は userId を優先し、
    // 他画面（ヘッダー・プロフィール）と絵柄を揃える
    userId: seat.userId,
    // id を持たないゲスト向けのフォールバック。
    // サフィックスの有無で絵柄が変わらないよう baseName を渡す
    baseName: memberBaseName(seat),
    seat,
  })),
);

const emit = defineEmits<{
  'seat-updated': [updated: SeatModel];
  'seat-added': [seat: SeatModel];
  'seat-removed': [seatId: string];
}>();

const {
  canEditCharacterName,
  canEditSeat,
  isEditing,
  loading,
  draftOf,
  setDraft,
  startEdit,
  submitEdit,
} = useSeatEdit(
  props.gameSession.lobbyId,
  props.gameSession.id,
  () => props.gameSession.seats,
  () => props.gameSession.status,
  () => props.gameSession.lobby.hostUserId,
  (updated) => emit('seat-updated', updated),
);

const {
  canSeat,
  canUnseat,
  seatableEntries,
  loading: seatLoading,
  seat,
  unseat,
} = useSeatManagement(
  props.gameSession.lobbyId,
  props.gameSession.id,
  () => props.gameSession.status,
  () => props.gameSession.lobby.hostUserId,
  () => props.gameSession.seats,
  () => props.activeEntries ?? [],
  (created) => emit('seat-added', created),
  (seatId) => emit('seat-removed', seatId),
);

/** 着席候補の表示名。ロビーの参加者一覧と同じ規則で出す */
const seatableOptions = computed(() =>
  seatableEntries.value.map((entry) => ({
    id: entry.id,
    label: memberDisplayName(entry),
  })),
);
</script>

<template>
  <BaseCard>
    <BaseSectionHeading class="header" level="h3" :icon="UsersRound">
      着席者
    </BaseSectionHeading>

    <div v-for="row in displaySeats" :key="row.id" class="user-container">
      <UserAvatar
        class="avatar"
        :size="35"
        :user-id="row.userId"
        :name="row.baseName"
      ></UserAvatar>

      <p v-if="!isEditing">
        <span v-if="row.characterName">
          {{ row.characterName }}
          <span class="user-name">@ </span>
        </span>
        <span class="user-name">{{ row.userName }}</span>
      </p>

      <div class="edit-char-name" v-else>
        <BaseTextBox
          :model-value="draftOf(row.id)"
          @update:model-value="(v) => setDraft(row.id, v)"
          placeholder="キャラクター名を入力"
          :disabled="loading || !canEditSeat(row.seat)"
        >
        </BaseTextBox>
        <span class="user-name">@ {{ row.userName }}</span>
      </div>

      <BaseButton
        v-if="!isEditing && canUnseat(row.seat)"
        class="unseat"
        variant="secondary"
        :left-icon="UserMinus"
        :loading="seatLoading"
        @click="unseat(row.id)"
      >
        外す
      </BaseButton>
    </div>

    <div v-if="canSeat && seatableOptions.length > 0" class="seatable">
      <p class="seatable-label">着席させる</p>
      <BaseButton
        v-for="option in seatableOptions"
        :key="option.id"
        variant="secondary"
        :left-icon="UserPlus"
        :loading="seatLoading"
        @click="seat(option.id)"
      >
        {{ option.label }}
      </BaseButton>
    </div>
    <div v-if="canEditCharacterName" class="actions">
      <BaseButton
        v-if="canEditCharacterName && !isEditing"
        variant="secondary"
        :left-icon="SquarePen"
        @click="startEdit"
      >
        キャラクターを編集する
      </BaseButton>
      <BaseButton
        v-else
        :left-icon="Check"
        @click="submitEdit"
        :loading="loading"
      >
        完了
      </BaseButton>
    </div>
  </BaseCard>
</template>

<style scoped>
.header {
  margin-bottom: var(--space-4);
}

.user-container {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;

  gap: var(--space-2);
  padding: var(--space-2);

  border-top: solid 2px var(--color-border);
}

.edit-char-name {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-2);
}

.user-name {
  color: var(--color-text-muted);
}

.seatable {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-2) 0;
  border-top: solid 2px var(--color-border);
}

.seatable-label {
  color: var(--color-text-muted);
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-3);

  > * {
    margin: 0 var(--space-1);
  }
}
</style>
