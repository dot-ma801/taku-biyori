<script setup lang="ts">
defineOptions({ name: 'LobbyList' });
import BaseButton from '@/components/button/BaseButton.vue';
import MyLobbyList from '@/features/Lobby/List/MyLobbyList.vue';
import PublicLobbyList from '@/features/Lobby/List/PublicLobbyList.vue';
import { useLobbyList } from '@/features/Lobby/List/useLobbyList';
import type { LobbyStatus } from '@taku-biyori/shared';
import { Plus } from '@lucide/vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

/**
 * 一覧の対象。
 * - `mine`: 自分のロビー（ホスト or 在籍中の参加者）。ダッシュボードの §7-5 の4セクション用
 * - `public`: 未参加の人向けの「募集中のロビー」。関心が違うので同じ枠には並べない
 */
type Scope = 'mine' | 'public';

const props = withDefaults(
  defineProps<{
    title?: string;
    statuses?: LobbyStatus[];
    scope?: Scope;
    /** 該当ロビーが1件も無いときにセクションごと描画しない */
    hideWhenEmpty?: boolean;
    /** 作成ボタンを描画しない（同じ画面に複数セクションを並べるとき用） */
    hideCreateButton?: boolean;
  }>(),
  { scope: 'mine' },
);

const router = useRouter();
// 出さない側は取得自体を省く（ダッシュボードの一覧リクエストを増やさない）
const isPublicScope = props.scope === 'public';
const { filteredMyLobbies, filteredPublicLobbies, hasFilteredLobbies } =
  useLobbyList(props.statuses, {
    skipMine: isPublicScope,
    skipPublic: !isPublicScope,
  });

const showPublicList = computed(
  () => isPublicScope && filteredPublicLobbies.value.length > 0,
);
const showMineSection = computed(() => !isPublicScope);
const hasTitle = computed(() => !isPublicScope && props.title != null);
// 「募集中のロビー」は0件なら丸ごと出さない（見出しだけが残らないように）
const isVisible = computed(() =>
  isPublicScope
    ? showPublicList.value
    : !props.hideWhenEmpty || hasFilteredLobbies.value,
);
const showCreateButton = computed(
  () => !isPublicScope && !props.hideCreateButton,
);

const onClickCreate = () => {
  router.push({ name: 'lobbies-new' });
};
</script>

<template>
  <div v-if="isVisible" class="container">
    <div v-if="hasTitle" class="section-header">
      <h2 class="section-title">{{ title }}</h2>
      <div v-if="showCreateButton" class="create-actions">
        <BaseButton :left-icon="Plus" @click="onClickCreate"
          >ロビーを作成</BaseButton
        >
      </div>
    </div>
    <div v-else-if="showCreateButton" class="create-actions create-btn">
      <BaseButton :left-icon="Plus" @click="onClickCreate"
        >ロビーを作成</BaseButton
      >
    </div>
    <MyLobbyList
      v-if="showMineSection"
      :my-lobbies="filteredMyLobbies"
    ></MyLobbyList>
    <PublicLobbyList
      v-if="showPublicList"
      :public-lobbies="filteredPublicLobbies"
    ></PublicLobbyList>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 500;
  color: var(--color-text);
}

.create-btn {
  align-self: flex-end;
}

.create-actions {
  display: flex;
  gap: var(--space-2);
}
</style>
