<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import { useHomeData } from '@/features/Home/useHomeData';
import { Bookmark } from '@lucide/vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { mySessions } = useHomeData();

const onClickOpen = (id: string) => {
  router.push({
    name: 'game-sessions-detail',
    params: {
      gameSessionId: id,
    },
  });
};
</script>

<template>
  <BaseCard>
    <BaseSectionHeading class="heading" level="h3" :icon="Bookmark">
      あなたのセッション
    </BaseSectionHeading>

    <div v-for="item in mySessions" class="item">
      <p>{{ item.title }}</p>
      <p>{{ item.scheduledAt }}</p>
      <p>{{ item.memberCount }} 人</p>
      <p>{{ item.status }}</p>
      <BaseButton @click="onClickOpen(item.id)">開く</BaseButton>
    </div>
  </BaseCard>
</template>

<style scoped>
.item {
  border-bottom: 1px solid var(--color-border);

  :last-child {
    border-bottom: none;
  }
}
</style>
