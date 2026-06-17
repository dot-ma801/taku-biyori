<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { listGameSessions } from '@/api/game-session';
import type { GameSessionListItem } from '@taku-biyori/shared';

const router = useRouter();

const gameSessions = ref<GameSessionListItem[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

const isEmpty = computed(
  () => !isLoading.value && gameSessions.value.length === 0,
);

onMounted(async () => {
  isLoading.value = true;
  try {
    gameSessions.value = await listGameSessions();
  } catch {
    error.value = 'セッション一覧の取得に失敗しました';
  } finally {
    isLoading.value = false;
  }
});

const goToDetail = (id: string) => router.push(`/game-sessions/${id}`);
const goToCreate = () => router.push('/game-sessions/new');
</script>

<template>
  <div class="top-page">
    <div class="toolbar">
      <span class="toolbar-title">▶ 卓日和 ホーム</span>
      <button class="cta-button-primary" @click="goToCreate">
        ＋ 新規作成
      </button>
    </div>

    <div class="list-section">
      <h2 class="list-heading">■ セッション一覧 ■</h2>

      <div v-if="isLoading" class="status-message">読み込み中...</div>
      <div v-else-if="error" class="status-message error">{{ error }}</div>
      <div v-else-if="isEmpty" class="status-message">
        セッションがまだありません。新規作成から卓を立ててください。
      </div>

      <table v-else class="session-table">
        <thead>
          <tr>
            <th>セッション名</th>
            <th>シナリオ</th>
            <th>ステータス</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="session in gameSessions"
            :key="session.id"
            class="session-row"
          >
            <td class="session-name">{{ session.title }}</td>
            <td>{{ session.scenarioName ?? '―' }}</td>
            <td>
              <span class="status-badge">{{ session.status }}</span>
            </td>
            <td>
              <button class="row-button" @click="goToDetail(session.id)">
                詳細 →
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer-note">
      <p>
        ※ このページは仮置きです。まともなトップ画面に変えてください。
      </p>
    </div>
  </div>
</template>

<style scoped>
.top-page {
  font-family: 'MS Gothic', 'ＭＳ ゴシック', monospace;
  padding: 1.5rem;
}

.toolbar {
  background: linear-gradient(180deg, #1a237e, #0d1257);
  color: white;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  border: 2px outset #1a237e;
}

.toolbar-title {
  font-size: 1rem;
  letter-spacing: 0.1em;
  color: #ffd54f;
}

.cta-button-primary {
  background: linear-gradient(180deg, #ef5350, #b71c1c);
  color: white;
  border: 2px outset #ef5350;
  padding: 0.4rem 1.2rem;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: 0.05em;
}

.cta-button-primary:hover {
  background: linear-gradient(180deg, #ff7043, #c62828);
}

.cta-button-primary:active {
  border-style: inset;
}

.list-section {
  background: white;
  border: 3px solid #1a237e;
  box-shadow: 6px 6px 0 #1a237e;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.list-heading {
  font-size: 0.95rem;
  color: #1a237e;
  letter-spacing: 0.2em;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px dashed #9e9e9e;
}

.status-message {
  padding: 2rem;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  border: 1px dashed #ccc;
}

.status-message.error {
  color: #c62828;
  background: #ffebee;
}

.session-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.session-table th {
  background: #e8eaf6;
  color: #1a237e;
  padding: 0.5rem 0.75rem;
  text-align: left;
  border: 1px solid #9fa8da;
  font-weight: bold;
  letter-spacing: 0.05em;
}

.session-table td {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e0e0e0;
  vertical-align: middle;
}

.session-row:nth-child(even) td {
  background: #f5f5f5;
}

.session-row:hover td {
  background: #fffde7;
}

.session-name {
  font-weight: bold;
  color: #1a237e;
}

.status-badge {
  background: #e8eaf6;
  color: #3949ab;
  padding: 0.15rem 0.5rem;
  border: 1px solid #9fa8da;
  font-size: 0.75rem;
}

.row-button {
  background: linear-gradient(180deg, #e0e0e0, #9e9e9e);
  border: 2px outset #e0e0e0;
  padding: 0.2rem 0.75rem;
  font-size: 0.8rem;
  cursor: pointer;
  font-family: inherit;
}

.row-button:hover {
  background: linear-gradient(180deg, #eeeeee, #bdbdbd);
}

.row-button:active {
  border-style: inset;
}

.footer-note {
  text-align: center;
  font-size: 0.7rem;
  color: #999;
  padding: 0.5rem;
}
</style>
