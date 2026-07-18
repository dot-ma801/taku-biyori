<script setup lang="ts">
defineOptions({ name: 'LobbyList' });
import BaseButton from '@/components/button/BaseButton.vue';
import MyLobbyList from '@/features/Lobby/List/MyLobbyList.vue';
import PublicLobbyList from '@/features/Lobby/List/PublicLobbyList.vue';
import { useLobbyList } from '@/features/Lobby/List/useLobbyList';
import type { LobbyStatus } from '@taku-biyori/shared';
import { Plus } from '@lucide/vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  title?: string;
  statuses?: LobbyStatus[];
}>();

const router = useRouter();
const { myLobbies, publicLobbies, filteredLobbies } = useLobbyList(props.statuses);

const hasTitle = computed(() => props.title != null);
const hasPublicLobbies = computed(() => publicLobbies.value.length > 0);
const isFiltered = computed(() => props.statuses !== undefined);

const onClickCreate = () => {
  router.push({ name: 'lobbies-new' });
};
</script>

<template>
  <div class="container">
    <div v-if="hasTitle" class="section-header">
      <h2 class="section-title">{{ title }}</h2>
      <BaseButton :left-icon="Plus" @click="onClickCreate"
        >ロビーを作成</BaseButton
      >
    </div>
    <BaseButton
      v-else
      class="create-btn"
      :left-icon="Plus"
      @click="onClickCreate"
      >ロビーを作成</BaseButton
    >
    <template v-if="isFiltered">
      <MyLobbyList :my-lobbies="filteredLobbies"></MyLobbyList>
    </template>
    <template v-else>
      <MyLobbyList :my-lobbies="myLobbies"></MyLobbyList>
      <PublicLobbyList
        v-if="hasPublicLobbies"
        :public-lobbies="publicLobbies"
      ></PublicLobbyList>
    </template>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
}

.create-btn {
  align-self: flex-end;
}
</style>
