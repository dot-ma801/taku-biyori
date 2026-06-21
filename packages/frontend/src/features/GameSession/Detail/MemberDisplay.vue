<script setup lang="ts">
import UserAvatar from '@/features/user/UserAvatar/UserAvatar.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import type { GameSessionDetail, GameSessionMember } from '@taku-biyori/shared';
import { UsersRound, SquarePen, Check } from '@lucide/vue';
import { useMemberEdit } from '@/features/GameSession/Detail/useMemberEdit';
import { computed } from 'vue';

const props = defineProps<{
  gameSession: GameSessionDetail;
}>();

const displayMembers = computed(() =>
  props.gameSession.members.map((member) => ({
    id: member.id,
    characterName: member.characterName,
    userName: member.userName ?? member.guestName ?? '（未設定）',
  })),
);

const emit = defineEmits<{
  'member-updated': [updated: GameSessionMember];
}>();

const {
  canEditCharacterName,
  isEditing,
  isDirty,
  loading,
  draftCharacterNames,
  startEdit,
  submitEdit,
} = useMemberEdit(
  props.gameSession.id,
  () => props.gameSession.members,
  () => props.gameSession.status,
  () => props.gameSession.createdBy,
  (updated) => emit('member-updated', updated),
);
</script>

<template>
  <BaseCard>
    <BaseSectionHeading class="header" level="h3" :icon="UsersRound">
      参加メンバー
    </BaseSectionHeading>

    <div v-for="member in displayMembers" :key="member.id" class="user-container">
      <UserAvatar class="avatar" :size="35" :name="member.userName"></UserAvatar>

      <p v-if="!isEditing">
        <span v-if="member.characterName"> {{ member.characterName }}
          <span class="user-name">@ </span>
        </span>
        <span class="user-name">{{ member.userName }}</span>
      </p>

      <div class="edit-char-name" v-else>
        <BaseTextBox v-model="draftCharacterNames[member.id]" placeholder="キャラクター名を入力" :disabled="loading">
        </BaseTextBox>
        <span class="user-name">@ {{ member.userName }}</span>
      </div>
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

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-3);

  >* {
    margin: 0 var(--space-1);
  }
}
</style>
