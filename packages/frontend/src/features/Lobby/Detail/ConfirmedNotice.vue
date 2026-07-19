<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import { useConfirmedLobby } from '@/features/Lobby/Detail/composables/useConfirmedLobby';
import type { LobbyDetail } from '@taku-biyori/shared';
import { ExternalLink } from '@lucide/vue';
import { useRouter } from 'vue-router';
import { computed } from 'vue';

const props = defineProps<{
  lobby: LobbyDetail;
}>();

const router = useRouter();
const { viewerKind, gameSessionId } = useConfirmedLobby(() => props.lobby);

const canNavigate = computed(() => gameSessionId.value !== null);

function goToGameSession() {
  if (!gameSessionId.value) return;
  router.push({
    name: 'game-sessions-detail',
    params: { gameSessionId: gameSessionId.value },
  });
}
</script>

<template>
  <BaseCard class="confirmed-notice">
    <template v-if="viewerKind === 'selected'">
      <p class="notice-message">
        卓が確定しました。当日を楽しみにしていてください！
      </p>
      <BaseButton
        v-if="canNavigate"
        variant="primary"
        :left-icon="ExternalLink"
        @click="goToGameSession"
      >
        卓の詳細を見る
      </BaseButton>
    </template>

    <template v-else-if="viewerKind === 'notSelected'">
      <p class="notice-message">
        今回は日程が合いませんでした。またの機会にぜひ遊びましょう。
      </p>
    </template>

    <template v-else>
      <p class="notice-message">開催日が確定しました。</p>
    </template>
  </BaseCard>
</template>

<style scoped>
.confirmed-notice {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.notice-message {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text);
}
</style>
