<script setup lang="ts">
import UserAvatar from '@/features/user/UserAvatar/UserAvatar.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import type { ProfileResponse } from '@taku-biyori/shared';
import { UserRound, SquarePen, Check, X } from '@lucide/vue';
import { computed } from 'vue';
import { useProfileEdit } from '@/features/Profile/useProfileEdit';

const props = defineProps<{
  profile: ProfileResponse;
}>();

const emit = defineEmits<{
  'profile-updated': [updated: ProfileResponse];
}>();

const displayName = computed(() => props.profile.name ?? '未設定');

const {
  isEditing,
  canSubmit,
  loading,
  draftName,
  startEdit,
  cancelEdit,
  submitEdit,
} = useProfileEdit(
  () => props.profile,
  (updated) => emit('profile-updated', updated),
);
</script>

<template>
  <BaseCard>
    <BaseSectionHeading class="header" level="h3" :icon="UserRound">
      プロフィール
    </BaseSectionHeading>

    <div class="user-container">
      <UserAvatar class="avatar" :size="96" :user-id="profile.id" />

      <p v-if="!isEditing" class="user-name">{{ displayName }}</p>

      <div v-else class="edit-name">
        <BaseTextBox
          v-model="draftName"
          label="ユーザー名"
          placeholder="ユーザー名を入力"
          required
          :disabled="loading"
        ></BaseTextBox>
      </div>
    </div>

    <div class="actions">
      <BaseButton
        v-if="!isEditing"
        variant="secondary"
        :left-icon="SquarePen"
        @click="startEdit"
      >
        ユーザー名を編集する
      </BaseButton>
      <template v-else>
        <BaseButton
          variant="ghost"
          :left-icon="X"
          :disabled="loading"
          @click="cancelEdit"
        >
          キャンセル
        </BaseButton>
        <BaseButton
          :left-icon="Check"
          :disabled="!canSubmit"
          :loading="loading"
          @click="submitEdit"
        >
          保存
        </BaseButton>
      </template>
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
  gap: var(--space-4);
  padding: var(--space-2);
}

.user-name {
  font-size: 1.4rem;
  font-weight: 600;
}

.edit-name {
  max-width: 320px;
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
