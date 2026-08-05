<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { NotebookPen, Lock, Eye, ArrowRight } from '@lucide/vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import UserAvatar from '@/features/user/UserAvatar/UserAvatar.vue';
import type { MyGameSessionPlayMemo } from '@taku-biyori/shared';
import type { PlayMemoMemberEntry } from '@/features/GameSession/PlayMemo/useSharedPlayMemos';
import { formatDateTimeShort } from '@/utils/date';

const props = defineProps<{
  gameSessionId: string;
  playMemo: MyGameSessionPlayMemo | null;
  canEditBody: boolean;
  /** 他メンバーの公開メモを読める時期か（完了・中止） */
  canViewShared: boolean;
  /** 公開しているメンバー（自分を含む）。読める時期でなければ空 */
  sharedEntries: PlayMemoMemberEntry[];
}>();

// 公開状態はサーバ値（shared_at の有無）から導く。
// 切り替えの UI はメモ画面側に置き、ここでは状態だけを見せる。
const isShared = computed(() => !!props.playMemo?.sharedAt);
const visibilityLabel = computed(() => (isShared.value ? '公開中' : '非公開'));
const visibilityIcon = computed(() => (isShared.value ? Eye : Lock));

const body = computed(() => props.playMemo?.body ?? '');
const hasBody = computed(() => body.value.length > 0);

const updatedLabel = computed(() => {
  const updatedAt = props.playMemo?.updatedAt;
  if (!updatedAt) return '';
  return `${formatDateTimeShort(updatedAt)} に保存`;
});

const metaLabel = computed(() => {
  if (!hasBody.value) return updatedLabel.value;
  return [`${body.value.length.toLocaleString()} 字`, updatedLabel.value]
    .filter(Boolean)
    .join('・');
});

const memoRoute = computed(() => ({
  name: 'game-sessions-play-memo',
  params: { gameSessionId: props.gameSessionId },
}));

/** そのメンバーのメモを開いた状態でメモ画面へ入る */
function memberRoute(memberId: string) {
  return { ...memoRoute.value, query: { member: memberId } };
}

// ---------- 実施前・当日（書く面） ----------

/** 書きかけを思い出す手がかり。全文はメモ画面で読む */
const writingEmptyMessage = computed(
  () => 'プレイ中の気づきを、自分だけのメモに残せます。',
);

const writingActionLabel = computed(() =>
  hasBody.value ? '続きを書く' : '最初のメモを書く',
);

// ---------- 完了・中止（読む面） ----------

const hasSharedEntries = computed(() => props.sharedEntries.length > 0);

/** 公開が1件も無いときは、読む導線の代わりに公開への導線を出す */
const readingActionLabel = computed(() =>
  hasSharedEntries.value ? 'メモを開く' : 'メモを開いて公開する',
);

const readingEmptyMessage = computed(() =>
  hasBody.value
    ? 'メモを公開すると、ほかのメンバーが読めるようになります。'
    : 'この卓のメモはまだ誰も公開していません。',
);
</script>

<template>
  <!--
    完了・中止。読む面なので「誰のメモが読めるか」を主役にする。
    メンバーごとにリンクを持たせるため、カード全体はリンクにしない。
  -->
  <BaseCard v-if="props.canViewShared">
    <div class="heading-row">
      <BaseSectionHeading level="h3" :icon="NotebookPen">
        プレイメモ
      </BaseSectionHeading>
      <span class="visibility" :class="{ 'visibility--shared': isShared }">
        <component :is="visibilityIcon" :size="12" aria-hidden="true" />
        {{ visibilityLabel }}
      </span>
    </div>

    <template v-if="hasSharedEntries">
      <p class="shared-label">公開しているメンバー</p>
      <ul class="chips">
        <li v-for="entry in props.sharedEntries" :key="entry.memberId">
          <RouterLink :to="memberRoute(entry.memberId)" class="chip">
            <UserAvatar
              :size="24"
              :user-id="entry.userId"
              :name="entry.avatarName"
            />
            {{ entry.primaryLabel }}
            <span v-if="entry.isMe" class="chip__me">（自分）</span>
          </RouterLink>
        </li>
      </ul>
    </template>

    <p v-else class="empty">{{ readingEmptyMessage }}</p>

    <div class="foot">
      <span class="meta">{{ metaLabel }}</span>
      <RouterLink :to="memoRoute" class="open-link">
        {{ readingActionLabel }}
        <ArrowRight :size="15" aria-hidden="true" />
      </RouterLink>
    </div>
  </BaseCard>

  <!--
    実施前・当日。書く面なのでカード全体をメモ画面への導線にし、
    押す場所を1つに固定する（プレイ中に何度も開くため）。
  -->
  <BaseCard
    v-else
    :link="{ to: memoRoute, label: 'プレイメモを開く' }"
    class="writing"
  >
    <div class="heading-row">
      <BaseSectionHeading level="h3" :icon="NotebookPen">
        プレイメモ
      </BaseSectionHeading>
      <span class="visibility" :class="{ 'visibility--shared': isShared }">
        <component :is="visibilityIcon" :size="12" aria-hidden="true" />
        {{ visibilityLabel }}
      </span>
    </div>

    <p v-if="hasBody" class="body">{{ body }}</p>
    <p v-else class="empty">{{ writingEmptyMessage }}</p>

    <div class="foot">
      <span class="meta">{{ metaLabel }}</span>
      <span class="open-link">
        {{ writingActionLabel }}
        <ArrowRight :size="15" aria-hidden="true" />
      </span>
    </div>
  </BaseCard>
</template>

<style scoped>
.heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.visibility {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);

  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 12px;
  white-space: nowrap;
}

.visibility--shared {
  border-color: var(--color-success);
  background: var(--color-success-soft);
  color: var(--color-success);
}

.body {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;

  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}

.empty {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.shared-label {
  margin: 0 0 var(--space-2);
  color: var(--color-text-muted);
  font-size: 12px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);

  margin: 0;
  padding: 0;
  list-style: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3) var(--space-1) var(--space-1);

  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-background);

  color: var(--color-text);
  font-size: var(--font-size-sm);
  text-decoration: none;
  white-space: nowrap;
}

.chip:hover {
  border-color: var(--color-primary);
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.chip__me {
  color: var(--color-text-muted);
  font-size: 12px;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);

  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}

.meta {
  color: var(--color-text-muted);
  font-size: 12px;
}

.open-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-left: auto;
  padding: var(--space-2) var(--space-4);

  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-on-primary);

  font-size: var(--font-size-sm);
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
}

a.open-link:hover {
  background: var(--color-primary-strong);
  color: var(--color-on-primary);
}

/* カード全体がリンクなので、ホバーはカード側の見た目に任せて色だけ追従させる */
.writing:hover .open-link {
  background: var(--color-primary-strong);
}
</style>
