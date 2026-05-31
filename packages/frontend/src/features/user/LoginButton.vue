<script setup lang="ts">
import { UserRound } from '@lucide/vue';
import BasePopover from '@/components/common/BasePopover/BasePopover.vue';
import BaseButton from '@/components/button/BaseButton.vue';
</script>

<template>
  <BasePopover placement="bottom">
    <!-- ボタン -->
    <template #activator>
      <button class="user-btn" @click="">
        <UserRound class="user-round"/>
      </button>
    </template>

    <!-- 中身 -->
    <ul>
      <li>
        <BaseButton variant="ghost"> サインイン / ログイン</BaseButton>
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
}

.user-round {
  color: var(--color-on-primary)
}

ul {
  margin: var(--space-2) 0; 
}
</style>
