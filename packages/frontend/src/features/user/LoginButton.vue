<script setup lang="ts">
import { ref } from 'vue';
import { UserRound } from '@lucide/vue';
import UserAvatar from '@/features/user/UserAvatar/UserAvatar.vue';
import BasePopover from '@/components/common/BasePopover/BasePopover.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const router = useRouter();
const isOpen = ref(false);

const onClickLogin = () => {
  isOpen.value = false;
  router.push({ name: 'login' });
};

const onClickLogout = async () => {
  try {
    await authStore.logout();
    isOpen.value = false;
    router.push('/');
  } catch (error) {
    console.error(error);
  }
};

const onClickUserName = () => {
  isOpen.value = false;
  router.push({ name: 'profile-setting' });
};
</script>

<template>
  <!-- ログイン済み -->
  <BasePopover
    v-if="authStore.isAuthenticated"
    v-model="isOpen"
    placement="bottom"
  >
    <!-- ボタン -->
    <template #activator>
      <button class="user-btn" aria-label="ユーザーメニューを開く">
        <UserAvatar />
      </button>
    </template>

    <!-- 中身 -->
    <ul>
      <li>
        <BaseButton variant="ghost" @click="onClickUserName">
          {{ authStore.user?.name }}
        </BaseButton>
      </li>
      <li>
        <BaseButton variant="ghost" @click="onClickLogout">
          ログアウト
        </BaseButton>
      </li>
    </ul>
  </BasePopover>

  <!-- 非ログイン -->
  <BasePopover v-else v-model="isOpen" placement="bottom">
    <!-- ボタン -->
    <template #activator>
      <button class="user-btn">
        <UserRound class="user-round" :size="30" />
      </button>
    </template>

    <!-- 中身 -->
    <ul>
      <li>
        <BaseButton variant="ghost" @click="onClickLogin">
          サインイン / ログイン
        </BaseButton>
      </li>
    </ul>
  </BasePopover>
</template>

<style scoped>
button {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  margin-left: auto;
  display: flex;
  align-items: center;

  border: 2px solid var(--color-on-primary);
  border-radius: var(--radius-full);
  width: 100%;
}

.user-round {
  color: var(--color-on-primary);
}

ul {
  margin: var(--space-2) 0;
}
</style>
