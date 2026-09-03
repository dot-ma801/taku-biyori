<script setup lang="ts">
defineOptions({ name: 'PublicLobbySection' });
import PublicLobbyList from '@/features/Lobby/List/PublicLobbyList.vue';
import { useLobbyList } from '@/features/Lobby/List/useLobbyList';
import { LobbyStatus } from '@taku-biyori/shared';
import { computed } from 'vue';

/**
 * 「募集中のロビー」だけを出すセクション。
 *
 * ダッシュボードの4セクション（design-v2 §7-5）はすべて「自分のもの」で、
 * 未参加の人がロビーを探す導線は関心が違う。同じ `LobbyList` に相乗りさせると
 * 「参加中のロビー」の下に他人のロビーが並んでしまうため、独立させている。
 */
const { filteredPublicLobbies } = useLobbyList([LobbyStatus.open], {
  skipMine: true,
});

const hasPublicLobbies = computed(() => filteredPublicLobbies.value.length > 0);
</script>

<template>
  <div v-if="hasPublicLobbies" class="container">
    <PublicLobbyList :public-lobbies="filteredPublicLobbies"></PublicLobbyList>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
