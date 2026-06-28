<script setup lang="ts">
defineOptions({ name: 'Home' });
import BaseButton from '@/components/button/BaseButton.vue';
import MySessionList from '@/features/Home/MySessionList.vue';
import PublicSessionList from '@/features/Home/PublicSessionList.vue';
import { Plus } from '@lucide/vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const onClickCreate = () => {
  router.push({name: 'game-sessions-new'})
}
</script>

<template>
  <div class="container">
    <BaseButton class="create-btn" :left-icon="Plus" @click="onClickCreate">セッションを作成</BaseButton>
    <MySessionList></MySessionList>
    <PublicSessionList></PublicSessionList>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.create-btn {
  align-self: flex-end;
}
</style>
