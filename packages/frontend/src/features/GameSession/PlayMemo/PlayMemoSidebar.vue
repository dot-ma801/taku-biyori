<script setup lang="ts">
import { Users } from '@lucide/vue';
import type {
  PlayMemoMemberEntry,
  PlayMemoMemberTag,
} from '@/features/GameSession/PlayMemo/useSharedPlayMemos';

const props = defineProps<{
  entries: PlayMemoMemberEntry[];
  selectedMemberId: string | null;
}>();

const emit = defineEmits<{
  select: [memberId: string];
}>();

/**
 * タグの表示文言。語彙は「公開 / 非公開 / ゲスト」の3つだけ（design-v1.2 §6）。
 * 読めない理由を示すだけで、「作成不可」のような禁止の言い方はしない。
 */
const TAG_LABELS: Record<PlayMemoMemberTag, string> = {
  shared: '公開',
  private: '非公開',
  guest: 'ゲスト',
};

function tagLabel(tag: PlayMemoMemberTag): string {
  return TAG_LABELS[tag];
}
</script>

<template>
  <nav class="sidebar" aria-label="メンバーの切り替え">
    <p class="sidebar__title">
      <Users :size="14" aria-hidden="true" />
      メンバー
    </p>

    <ul class="list">
      <li
        v-for="entry in props.entries"
        :key="entry.memberId"
        class="list__item"
      >
        <!--
          読めない相手も押せる。押すと本文の代わりに読めない理由が出る
          （disabled にすると、なぜ開かないのかを伝える場所が無くなる）。
        -->
        <button
          type="button"
          class="member"
          :class="{
            'member--selected': entry.memberId === props.selectedMemberId,
            'member--unreadable': !entry.readable,
          }"
          :aria-current="entry.memberId === props.selectedMemberId"
          @click="emit('select', entry.memberId)"
        >
          <span class="member__labels">
            <span class="member__primary">{{ entry.primaryLabel }}</span>
            <span v-if="entry.secondaryLabel" class="member__secondary">
              {{ entry.secondaryLabel }}
            </span>
          </span>
          <span class="tag" :class="`tag--${entry.tag}`">
            {{ tagLabel(entry.tag) }}
          </span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.sidebar {
  padding: var(--space-3);

  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.sidebar__title {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin: 0 0 var(--space-2);

  color: var(--color-text-muted);
  font-size: 12px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);

  margin: 0;
  padding: 0;
  list-style: none;
}

.member {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2);

  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);

  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  text-align: left;
  cursor: pointer;
}

.member:hover {
  background: var(--color-surface-muted);
}

/* 読めない相手。押せるが本文は出ないので、読める行より控えめに見せる */
.member--unreadable {
  color: var(--color-text-muted);
}

.member--selected {
  background: var(--color-surface-muted);
  border-color: var(--color-primary);
}

.member__labels {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.member__primary {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member__secondary {
  color: var(--color-text-muted);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag {
  flex-shrink: 0;
  padding: 1px var(--space-2);

  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  font-size: 11px;
  white-space: nowrap;
}

.tag--shared {
  border-color: var(--color-success);
  background: var(--color-success-soft);
  color: var(--color-success);
}

/* モバイルではサイドバーを畳み、横スクロールのチップ列として本文の上に置く */
@media (max-width: 780px) {
  .list {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: var(--space-1);
  }

  .list__item {
    flex-shrink: 0;
  }

  .member {
    width: auto;
  }
}
</style>
