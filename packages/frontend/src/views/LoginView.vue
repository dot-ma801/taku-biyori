<script setup lang="ts">
import BaseTabs, {
  type TabItem,
} from '@/components/common/BaseTabs/BaseTabs.vue';
import LoginCard from '@/features/user/LoginCard.vue';
import SignupCard from '@/features/user/SignupCard.vue';

const tabs: TabItem[] = [
  {
    value: 'signin',
    label: 'ログイン',
  },
  {
    value: 'signup',
    label: '新規作成',
  },
];
</script>

<template>
  <div class="container">
    <BaseTabs :tabs="tabs" stretch fixed-height>
      <!-- ログインタブ -->
      <template #signin>
        <LoginCard class="card"></LoginCard>
      </template>

      <!-- 新規作成タブ -->
      <template #signup>
        <SignupCard class="card" />
      </template>
    </BaseTabs>
  </div>
</template>

<style scoped>
.container {
  height: 100%;
  padding: 0 var(--space-7);
  align-items: center;

  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card {
  width: 400px;
  margin-bottom: 100px;
}
</style>
