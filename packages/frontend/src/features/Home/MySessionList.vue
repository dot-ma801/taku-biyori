<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import GameSessionStatusBadge from '@/components/common/GameSessionStatusBadge/GameSessionStatusBadge.vue';
import { useHomeData } from '@/features/Home/useHomeData';
import { Bookmark, Calendar, UsersRound } from '@lucide/vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { mySessions } = useHomeData();

const formattedDate = computed(() => {
  return mySessions.value.map((item) => item.scheduledAt ?? '調整中');
});

const formattedMaxMembers = computed(() => {
  return mySessions.value.map((item) => item.maxMembers ?? '-');
});

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

    <div v-for="(item, idx) in mySessions" class="item">
      <div>
        <BaseSectionHeading level="h4">{{ item.title }}</BaseSectionHeading>
        <div class="session-meta">
          <Calendar :size="16" />
          <p>{{ formattedDate[idx] }}</p>
          <UsersRound :size="16"/>
          <p>{{ item.memberCount }}/{{ formattedMaxMembers[idx] }}</p>
        </div>
      </div>
      <div class="right-area">
        <GameSessionStatusBadge :status="item.status" />
        <BaseButton variant="secondary" @click="onClickOpen(item.id)">
          開く
        </BaseButton>
      </div>
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

  .right-area {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
}

.item:last-child {
  border-bottom: none;
}

.session-meta {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
</style>
