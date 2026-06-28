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
    <BaseSectionHeading level="h3" :icon="Bookmark">
      あなたのセッション
    </BaseSectionHeading>

    <div v-for="item in mySessions" class="item">
      <div>
        <div class="title-area">
          <BaseSectionHeading level="h4">{{ item.title }}</BaseSectionHeading>
          <p>{{ item.status }}</p>
        </div>
        <p>{{ item.scheduledAt }} / {{ item.memberCount }} 人</p>
      </div>

      <BaseButton @click="onClickOpen(item.id)">開く</BaseButton>
    </div>
  </BaseCard>
</template>

<style scoped>
.item {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: var(--space-2);

  border-bottom: 1px solid var(--color-border);

  .title-area{
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  :last-child {
    border-bottom: none;
  }
}
</style>
