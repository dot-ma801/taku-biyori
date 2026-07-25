<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import { KeyRound, Check, X } from '@lucide/vue';
import { useAccounts } from '@/features/Profile/useAccounts';
import { usePasswordChange } from '@/features/Profile/usePasswordChange';

// 取得完了までは hasPassword が false のため、カードのチラつきを避けて描画を保留する
const { hasPassword, loading: accountsLoading } = useAccounts();

const {
  isEditing,
  canSubmit,
  loading,
  currentPassword,
  newPassword,
  confirmPassword,
  startEdit,
  cancelEdit,
  submitEdit,
} = usePasswordChange();
</script>

<template>
  <BaseCard v-if="!accountsLoading && hasPassword">
    <BaseSectionHeading class="header" level="h3" :icon="KeyRound">
      パスワード
    </BaseSectionHeading>

    <div v-if="isEditing" class="fields">
      <BaseTextBox
        v-model="currentPassword"
        label="現在のパスワード"
        type="password"
        autocomplete="current-password"
        required
        :disabled="loading"
      ></BaseTextBox>
      <BaseTextBox
        v-model="newPassword"
        label="新しいパスワード"
        type="password"
        autocomplete="new-password"
        required
        :disabled="loading"
      ></BaseTextBox>
      <BaseTextBox
        v-model="confirmPassword"
        label="新しいパスワード（確認）"
        type="password"
        autocomplete="new-password"
        required
        :disabled="loading"
      ></BaseTextBox>
    </div>

    <div class="actions">
      <BaseButton
        v-if="!isEditing"
        variant="secondary"
        :left-icon="KeyRound"
        @click="startEdit"
      >
        パスワードを変更する
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

.fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 320px;
  padding: var(--space-2);
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
