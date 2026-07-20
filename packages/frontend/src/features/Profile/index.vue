<script setup lang="ts">
defineOptions({ name: 'ProfileDetail' });
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import ProfileDisplay from '@/features/Profile/ProfileDisplay.vue';
import PasswordChangeCard from '@/features/Profile/PasswordChangeCard.vue';
import { useGetProfile } from '@/features/Profile/useGetProfile';
import { useAuthStore } from '@/stores/auth';
import type { ProfileResponse } from '@taku-biyori/shared';

const { profile, loading, errorMessage, patchProfile } = useGetProfile();
const authStore = useAuthStore();

// ヘッダー等が参照する authStore.user も、更新後のセッションで同期する
function onProfileUpdated(updated: ProfileResponse) {
  patchProfile(updated);
  authStore.initSession();
}
</script>

<template>
  <div v-if="loading">読み込み中...</div>
  <div v-else-if="errorMessage">{{ errorMessage }}</div>

  <div v-else-if="profile" class="container">
    <BaseSectionHeading level="h1">マイページ</BaseSectionHeading>

    <ProfileDisplay
      :profile="profile"
      @profile-updated="onProfileUpdated"
    ></ProfileDisplay>

    <PasswordChangeCard></PasswordChangeCard>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
</style>
