<script setup lang="ts">
import { ref } from 'vue';
import { UserRound } from '@lucide/vue';
import UserAvatar from '@/features/user/UserAvatar/UserAvatar.vue';
import LogoutDialog from '@/features/user/LogoutDialog.vue';
import BasePopover from '@/components/common/BasePopover/BasePopover.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const router = useRouter();
const isOpen = ref(false);
const logoutDialogModel = ref(false);

const onClickLogin = () => {
  isOpen.value = false;
  router.push({ name: 'login' });
};

const onClickLogout = () => {
  isOpen.value = false;
  logoutDialogModel.value = true;
};

const onConfirmLogout = async () => {
  try {
    await authStore.logout();
    logoutDialogModel.value = false;
    await router.push('/');
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

  <LogoutDialog v-model="logoutDialogModel" @confirm="onConfirmLogout" />
</template>

<style scoped>
/* ヘッダーが --color-primary の帯だった頃の名残で、枠と色を
   --color-on-primary（＝白）で塗っていた。シェルが --surface になったので
   通常のコントロール色に戻す。 */
.user-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: none;
  border: var(--border-width) solid transparent;
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-control);
}
.user-btn:hover {
  color: var(--text-primary);
  border-color: var(--border-strong);
}
.user-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.user-round {
  color: inherit;
}

ul {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: 0;
  padding: var(--space-1);
  list-style: none;
}

li {
  display: flex;
}

li > * {
  flex: 1;
  justify-content: flex-start;
}
</style>
