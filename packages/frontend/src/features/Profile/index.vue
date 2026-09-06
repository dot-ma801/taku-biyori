<script setup lang="ts">
defineOptions({ name: 'ProfileDetail' });
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import ProfileDisplay from '@/features/Profile/ProfileDisplay.vue';
import PasswordChangeCard from '@/features/Profile/PasswordChangeCard.vue';
import CompletedTables from '@/features/Profile/CompletedTables.vue';
import LogoutDialog from '@/features/user/LogoutDialog.vue';
import { useGetProfile } from '@/features/Profile/useGetProfile';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { LogOut } from '@lucide/vue';
import type { ProfileResponse } from '@taku-biyori/shared';

const { profile, loading, errorMessage, patchProfile } = useGetProfile();
const authStore = useAuthStore();
const router = useRouter();

const logoutDialogModel = ref(false);

// ヘッダー等が参照する authStore.user も、更新後のセッションで同期する
function onProfileUpdated(updated: ProfileResponse) {
  patchProfile(updated);
  authStore.initSession();
}

const onConfirmLogout = async () => {
  try {
    await authStore.logout();
    logoutDialogModel.value = false;
    await router.push('/');
  } catch (error) {
    console.error(error);
  }
};
</script>

<template>
  <div v-if="loading">読み込み中...</div>
  <div v-else-if="errorMessage">{{ errorMessage }}</div>

  <div v-else-if="profile" class="container">
    <BaseSectionHeading level="h1">マイページ</BaseSectionHeading>

    <!-- 左は設定系、右は履歴。関心が違うので混ぜず左右に分ける -->
    <div class="columns">
      <div class="columns__settings">
        <ProfileDisplay
          :profile="profile"
          @profile-updated="onProfileUpdated"
        ></ProfileDisplay>

        <PasswordChangeCard></PasswordChangeCard>

        <div class="logout-area">
          <BaseButton
            variant="ghost"
            :left-icon="LogOut"
            @click="logoutDialogModel = true"
          >
            ログアウト
          </BaseButton>
        </div>
      </div>

      <div class="columns__history">
        <CompletedTables />
      </div>
    </div>

    <LogoutDialog v-model="logoutDialogModel" @confirm="onConfirmLogout" />
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* デスクトップは 1.4fr / 1fr の2カラム（デザインシステムのレイアウト規則）。
   狭い画面では素直に縦積みへ戻す。 */
.columns {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: var(--space-6);
  align-items: start;
}

.columns__settings,
.columns__history {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  min-width: 0;
}

.logout-area {
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .columns {
    grid-template-columns: 1fr;
  }
}
</style>
