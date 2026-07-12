<script setup lang="ts">
// ==========================================================
// 仮置きのロビー一覧画面
// ==========================================================
defineOptions({ name: 'LobbyListPlaceholder' });
import { onMounted, ref } from 'vue';
import type { Lobby } from '@taku-biyori/shared';
import { listLobbies } from '@/api/lobby';
import { ApiError } from '@/lib/api-client';

const lobbies = ref<Lobby[]>([]);
const loading = ref(true);
const errorMessage = ref('');

async function fetchLobbies() {
  loading.value = true;
  errorMessage.value = '';
  try {
    lobbies.value = await listLobbies();
  } catch (err) {
    errorMessage.value =
      err instanceof ApiError ? err.message : 'エラーが発生しました';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchLobbies);
</script>

<template>
  <div class="homepage">
    <p class="center">
      <RouterLink :to="{ name: 'lobbies-new' }" class="new-link">
        ⇒⇒⇒ ロビーの新規作成はコチラ！！ ⇐⇐⇐
      </RouterLink>
    </p>

    <hr />

    <p v-if="loading" class="center blink">Now Loading......</p>

    <p v-else-if="errorMessage" class="center error">
      ※※※ {{ errorMessage }} ※※※<br />
      <a href="#" @click.prevent="fetchLobbies">もういちど読み込む</a>
    </p>

    <p v-else-if="lobbies.length === 0" class="center">
      まだロビーがありません…(´・ω・｀)ｼｮﾎﾞｰﾝ
    </p>

    <table v-else class="list-table" align="center" border="3">
      <tbody>
        <tr class="list-header">
          <td>No.</td>
          <td>タイトル</td>
          <td>じょうたい</td>
          <td>編集</td>
        </tr>
        <tr v-for="(lobby, index) in lobbies" :key="lobby.id">
          <td class="center">{{ index + 1 }}</td>
          <td>◆ {{ lobby.title }}</td>
          <td class="center">{{ lobby.status }}</td>
          <td class="center">
            <RouterLink
              :to="{ name: 'lobbies-edit', params: { lobbyId: lobby.id } }"
            >
              [編集する]
            </RouterLink>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* 意図的に当時の見た目を再現している。デザイントークンは使わない */
.homepage {
  background-color: #ffffcc;
  font-family: 'MS PGothic', 'Comic Sans MS', serif;
  color: #000080;
  padding: 8px;
  min-height: 100vh;
}

.center {
  text-align: center;
}

.blink {
  animation: blink 1s step-start infinite;
  color: #ff0000;
  font-weight: bold;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.new-link {
  font-size: 18px;
  font-weight: bold;
  color: #0000ff;
}

.new-link:visited {
  color: #800080;
}

.error {
  color: #ff0000;
  background-color: #ffcccc;
  border: 2px dashed #ff0000;
  padding: 4px;
}

.list-table {
  background-color: #ffffff;
  border-collapse: separate;
}

.list-table td {
  border: 1px solid #808080;
  padding: 2px 10px;
  font-size: 14px;
}

.list-header {
  background-color: #ffcc00;
  font-weight: bold;
}

hr {
  border: none;
  border-top: 3px double #ff9900;
}
</style>
