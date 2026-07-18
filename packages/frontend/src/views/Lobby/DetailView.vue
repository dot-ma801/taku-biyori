<script setup lang="ts">
import PageContainer from '@/components/layout/PageContainer/PageContainer.vue';
import LobbyDetail from '@/features/Lobby/Detail/index.vue';
const props = defineProps<{ lobbyId: string }>();
</script>

<template>
  <PageContainer>
    <LobbyDetail :lobby-id="props.lobbyId" />
  </PageContainer>
</template>

<style scoped></style>
