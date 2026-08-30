<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import GameSessionStatusBadge from '@/components/common/GameSessionStatusBadge/GameSessionStatusBadge.vue';
import { listLobbyGameSessions } from '@/api/game-session';
import type { GameSessionListItemModel } from '@/models/game-session';
import { Calendar, Plus, UsersRound } from '@lucide/vue';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  lobbyId: string;
  canCreate: boolean;
}>();

const emit = defineEmits<{ create: [] }>();

const router = useRouter();
const sessions = ref<GameSessionListItemModel[]>([]);
const loading = ref(false);
const errorMessage = ref('');

const isEmpty = computed(() => !loading.value && sessions.value.length === 0);

async function fetchSessions() {
  loading.value = true;
  errorMessage.value = '';
  try {
    sessions.value = await listLobbyGameSessions(props.lobbyId);
  } catch {
    errorMessage.value = '開催一覧の取得に失敗しました';
  } finally {
    loading.value = false;
  }
}

function openSession(session: GameSessionListItemModel) {
  void router.push({
    name: 'game-sessions-detail',
    params: { lobbyId: session.lobbyId, gameSessionId: session.id },
  });
}

watch(() => props.lobbyId, fetchSessions, { immediate: true });

defineExpose({ fetchSessions });
</script>

<template>
  <BaseCard>
    <div class="header">
      <BaseSectionHeading level="h3" :icon="Calendar">開催一覧</BaseSectionHeading>
      <BaseButton v-if="props.canCreate" :left-icon="Plus" @click="emit('create')">
        開催を追加する
      </BaseButton>
    </div>

    <p v-if="loading" class="message">読み込み中...</p>
    <p v-else-if="errorMessage" class="message error">{{ errorMessage }}</p>
    <p v-else-if="isEmpty" class="message">開催はまだありません</p>
    <button
      v-for="session in sessions"
      v-else
      :key="session.id"
      type="button"
      class="session"
      @click="openSession(session)"
    >
      <span class="session-main">
        <strong>{{ session.title }}</strong>
        <span class="session-meta">
          <span>{{ session.scheduledAt }}</span>
          <span v-if="session.timeLabel">{{ session.timeLabel }}</span>
          <span><UsersRound :size="14" />{{ session.seatCount }}人</span>
        </span>
      </span>
      <GameSessionStatusBadge :status="session.status" />
    </button>
  </BaseCard>
</template>

<style scoped>
.header { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-3); }
.message { margin: 0; color: var(--color-text-muted); font-size: var(--font-size-sm); }
.error { color: var(--color-error); }
.session { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-3) 0; background: transparent; border: 0; border-top: 1px solid var(--color-border); color: var(--color-text); text-align: left; cursor: pointer; }
.session-main { display: flex; flex-direction: column; gap: var(--space-1); }
.session-meta { display: flex; align-items: center; gap: var(--space-2); color: var(--color-text-muted); font-size: var(--font-size-sm); }
.session-meta > span { display: inline-flex; align-items: center; gap: 2px; }
</style>
