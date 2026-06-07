<script setup lang="ts">
import UserAvatar from '@/features/user/UserAvatar/UserAvatar.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import { UsersRound } from '@lucide/vue';
</script>

<template>
  <BaseCard>
    <BaseSectionHeading class="header" level="h3" :icon="UsersRound">
      参加メンバー
    </BaseSectionHeading>

    <div v-for="i in 3" :key="i" class="user-container">
      <UserAvatar class="avatar"></UserAvatar>

      <p class="user-name">{{ '田中' }}</p>
      <p class="char-name">キャラクター：{{ 'チシャ猫' }}</p>
    </div>
  </BaseCard>
</template>

<style scoped>
.header {
  margin-bottom: var(--space-4);
}

.user-container {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 1fr 1fr;
  align-items: center;

  border-top: solid 2px var(--color-border);

  padding: var(--space-2);

  .avatar {
    grid-column: 1 / 2;
    grid-row: 1 / 3;
    margin: var(--space-2);
  }

  .user-name {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
  }

  .char-name {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
  }
}
</style>
