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
  /** 該当募集枠が1件も無いときにセクションごと描画しない */
  hideWhenEmpty?: boolean;
  /** 作成ボタンを描画しない（同じ画面に複数セクションを並べるとき用） */
  hideCreateButton?: boolean;
}>();

const router = useRouter();
const { filteredMyLobbies, filteredPublicLobbies, hasFilteredLobbies } =
  useLobbyList(props.statuses);

const hasTitle = computed(() => props.title != null);
const isVisible = computed(
  () => !props.hideWhenEmpty || hasFilteredLobbies.value,
);
const showCreateButton = computed(() => !props.hideCreateButton);
const hasFilteredPublicLobbies = computed(
  () => filteredPublicLobbies.value.length > 0,
);

const onClickCreate = () => {
  router.push({ name: 'lobbies-new' });
};
</script>

<template>
  <div v-if="isVisible" class="container">
    <div v-if="hasTitle" class="section-header">
      <h2 class="section-title">{{ title }}</h2>
      <BaseButton
        v-if="showCreateButton"
        :left-icon="Plus"
        @click="onClickCreate"
        >ロビーを作成</BaseButton
      >
    </div>
    <BaseButton
      v-else-if="showCreateButton"
      class="create-btn"
      :left-icon="Plus"
      @click="onClickCreate"
      >ロビーを作成</BaseButton
    >
    <MyLobbyList :my-lobbies="filteredMyLobbies"></MyLobbyList>
    <PublicLobbyList
      v-if="hasFilteredPublicLobbies"
      :public-lobbies="filteredPublicLobbies"
    ></PublicLobbyList>
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
  font-weight: 500;
  color: var(--color-text);
}

.create-btn {
  align-self: flex-end;
}
</style>
