<script setup lang="ts">
import UserAvatar from '@/features/user/UserAvatar/UserAvatar.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import type { GameSessionDetail, GameSessionMember } from '@taku-biyori/shared';
import { UsersRound, SquarePen, Check } from '@lucide/vue';
import { useMemberEdit } from '@/features/GameSession/Detail/useMemberEdit';

const props = defineProps<{
  gameSession: GameSessionDetail;
}>();

const emit = defineEmits<{
  'member-updated': [updated: GameSessionMember];
}>();

const {
  myMember,
  canEditCharacterName,
  isEditing,
  draftCharacterName,
  isDirty,
  loading,
  startEdit,
  cancelEdit,
  submitEdit, } = useMemberEdit(
    props.gameSession.id,
    () => props.gameSession.members,
    () => props.gameSession.status,
    (updated) => emit('member-updated', updated),
  );
</script>

<template>
  <BaseCard>
    <BaseSectionHeading class="header" level="h3" :icon="UsersRound">
      参加メンバー
    </BaseSectionHeading>

    <div v-for="member in props.gameSession.members" :key="member.id" class="user-container">
      <UserAvatar class="avatar" :size="35" :name="member.userName ?? member.guestName ?? undefined"></UserAvatar>

      <p class="user-name">
        {{ member.userName ?? member.guestName ?? '（未設定）' }}
      </p>
      <p v-if="!isEditing" class="char-name">
        キャラクター：{{ member.characterName ?? '未設定' }}
      </p>

      <BaseTextBox v-else class="char-name" v-model="draftCharacterName" label="キャラクター名" placeholder="キャラクター名を入力"
        :disabled="loading"></BaseTextBox>
    </div>
    <div v-if="canEditCharacterName" class="actions">
      <BaseButton v-if="canEditCharacterName && !isEditing" variant="secondary" :left-icon="SquarePen"
        @click="startEdit">
        キャラクターを編集する
      </BaseButton>
      <BaseButton v-else :left-icon="Check" @click="submitEdit" :loading="loading">
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
  grid-template-columns: auto 1fr;
  grid-template-rows: 1fr 1fr;
  align-items: center;

  border-top: solid 2px var(--color-border);

  padding: var(--space-2);

  .avatar {
    grid-column: 1 / 2;
    grid-row: 1 / 3;
    margin: var(--space-2);
  }

  .user-name {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
  }

  .char-name {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-3);

  >* {
    margin: 0 var(--space-1);
  }
}
</style>
