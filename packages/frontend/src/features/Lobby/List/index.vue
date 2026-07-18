<script setup lang="ts">
defineOptions({ name: 'LobbyList' });
import BaseButton from '@/components/button/BaseButton.vue';
import MyLobbyList from '@/features/Lobby/List/MyLobbyList.vue';
import PublicLobbyList from '@/features/Lobby/List/PublicLobbyList.vue';
import { useLobbyList } from '@/features/Lobby/List/useLobbyList';
import { Plus } from '@lucide/vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { myLobbies, publicLobbies } = useLobbyList();

const hasPublicLobbies = computed(() => publicLobbies.value.length > 0);

const onClickCreate = () => {
  router.push({ name: 'lobbies-new' });
};
</script>

<template>
  <div class="container">
    <BaseButton class="create-btn" :left-icon="Plus" @click="onClickCreate"
      >募集枠を作成</BaseButton
    >
    <MyLobbyList :my-lobbies="myLobbies"></MyLobbyList>
    <PublicLobbyList
      v-if="hasPublicLobbies"
      :public-lobbies="publicLobbies"
    ></PublicLobbyList>
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
