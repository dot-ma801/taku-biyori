<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import {
  RouterLink,
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
} from 'vue-router';
import { ArrowLeft, Check, Eye, Lock, NotebookPen } from '@lucide/vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseAlert from '@/components/common/BaseAlert/BaseAlert.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import BaseSwitch from '@/components/form/BaseSwitch/BaseSwitch.vue';
import BaseTextArea from '@/components/form/BaseTextArea/BaseTextArea.vue';
import { usePlayMemoEdit } from '@/features/GameSession/PlayMemo/usePlayMemoEdit';
import type { PlayMemoVisibilityStatus } from '@/features/GameSession/PlayMemo/useMyPlayMemo';
import type { MyGameSessionPlayMemo } from '@taku-biyori/shared';

const props = defineProps<{
  gameSessionId: string;
  gameSessionTitle: string;
  playMemo: MyGameSessionPlayMemo | null;
  canEditBody: boolean;
  isShared: boolean;
  canToggleVisibility: boolean;
  visibilityStatus: PlayMemoVisibilityStatus;
}>();

const emit = defineEmits<{
  saved: [saved: MyGameSessionPlayMemo];
  // 公開状態の所有者は useMyPlayMemo なので、ここでは切替を依頼するだけ
  'visibility-change': [shared: boolean];
}>();

const {
  draftBody,
  status,
  isDirty,
  length,
  isOverLimit,
  maxLength,
  setDraft,
  save,
} = usePlayMemoEdit(
  props.gameSessionId,
  () => props.playMemo,
  (saved) => emit('saved', saved),
);

/**
 * 本文が閉じているか。
 * サーバ由来のステータス（completed / cancelled）に加え、
 * 書いている最中に卓が完了して 409 を受けた場合（locked）も含む。
 */
const isReadOnly = computed(
  () => !props.canEditBody || status.value === 'locked',
);

const statusLabel = computed(() => {
  if (isReadOnly.value) return '';
  const labels: Record<typeof status.value, string> = {
    idle: '',
    dirty: '未保存の変更があります',
    saving: '保存しています…',
    saved: '保存しました',
    failed: '保存できませんでした',
    locked: '',
  };
  return labels[status.value];
});

const statusVariant = computed(() => {
  if (status.value === 'saved') return 'status--ok';
  if (status.value === 'failed') return 'status--ng';
  return 'status--muted';
});

const counterLabel = computed(
  () => `${length.value.toLocaleString()} / ${maxLength.toLocaleString()}`,
);

const detailRoute = computed(() => ({
  name: 'game-sessions-detail',
  params: { gameSessionId: props.gameSessionId },
}));

const showLockedNotice = computed(() => status.value === 'locked');
const showFailedNotice = computed(() => status.value === 'failed');
const canSaveNow = computed(
  () => isDirty.value && !isOverLimit.value && status.value !== 'saving',
);
const isSaving = computed(() => status.value === 'saving');

/**
 * 本文を読み取り専用で表示するときの内容。
 *
 * `draftBody` ではなくサーバ値（`props.playMemo`）を表示する。
 * locked（409）は「保存しようとして拒否された」ケースなので、`draftBody` には
 * サーバに保存されていない本文が残り得る。上の案内文が「最後に保存された
 * 内容を表示しています」と言っている以上、表示もサーバ値に揃えないと
 * ユーザーが保存済みだと誤解したまま未保存の内容を失う。
 */
const readonlyBody = computed(() => props.playMemo?.body ?? '');

// ---------- 公開・非公開の切替 ----------

const visibilityIcon = computed(() => (props.isShared ? Eye : Lock));
const visibilityLabel = computed(() => (props.isShared ? '公開中' : '非公開'));

const isVisibilitySaving = computed(() => props.visibilityStatus === 'saving');
const showVisibilityFailedNotice = computed(
  () => props.visibilityStatus === 'failed',
);

/**
 * 公開トグルの説明。既定が非公開であることと、公開したときに誰が読めるのかを示す
 * （要求 §4「公開・非公開の状態がひと目で分かる」）。
 */
const visibilityDescription = computed(() => {
  if (!props.canToggleVisibility) {
    return '本文を保存すると、このメモを公開できるようになります。';
  }
  return props.isShared
    ? '卓が完了・中止したあと、ほかの人がこのメモを読めます。'
    : 'このメモはあなただけが読めます。公開すると、卓が完了・中止したあとにほかの人も読めるようになります。';
});

// 本文の保存とは独立した操作なので、本文が編集不可でもトグルは活性のまま。
// 切替はその場で反映する（元に戻すのもトグル1回で済むため確認は挟まない）
function onToggleVisibility(next: boolean) {
  emit('visibility-change', next);
}

const overLimitLeaveMessage = computed(
  () =>
    `本文が上限（${maxLength.toLocaleString()}文字）を超えているため保存できません。このページを離れると変更は失われます。よろしいですか？`,
);
const dirtyLeaveMessage =
  '保存していない変更があります。このページを離れると失われます。よろしいですか？';

/** 未保存の変更を抱えたまま離れようとしているか */
const hasUnsavedChanges = computed(() => !isReadOnly.value && isDirty.value);

/**
 * 未保存の変更があれば確認する。破棄してよければ true。
 *
 * 上限超過は保存ボタンも押せない状態なので、なぜ保存できないのかが
 * 伝わるよう文言を出し分ける。
 * NOTE: 確認 UI はプロジェクトのダイアログに寄せる余地があるが、
 *       ナビゲーションガードの中で解決を待つ必要があるため今は confirm を使う。
 */
function confirmDiscardChanges(): boolean {
  if (!hasUnsavedChanges.value) return true;

  return window.confirm(
    isOverLimit.value ? overLimitLeaveMessage.value : dirtyLeaveMessage,
  );
}

// 保存は明示的な操作のみなので、未保存のまま離れようとしたら必ず確認する
onBeforeRouteLeave(() => confirmDiscardChanges());

// サイドバーでのメンバー切り替えは同じルートのクエリ変更なので
// onBeforeRouteLeave が発火しない。切り替えでも変更が黙って失われないよう、
// onBeforeRouteUpdate でも同じ確認を出す（design-v1.2 §6）
onBeforeRouteUpdate(() => confirmDiscardChanges());

// アプリ内の遷移は onBeforeRouteLeave が拾うが、リロード・タブを閉じる・
// 外部サイトへ移動する経路は拾えないため、ブラウザ側の確認も併せて出す。
// 文言はブラウザが固定のものを使うため、preventDefault だけ行う。
function warnOnUnload(event: BeforeUnloadEvent) {
  if (!hasUnsavedChanges.value) return;
  event.preventDefault();
}

onMounted(() => {
  window.addEventListener('beforeunload', warnOnUnload);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', warnOnUnload);
});
</script>

<template>
  <BaseCard>
    <div class="head">
      <RouterLink :to="detailRoute" class="back" aria-label="卓の詳細へ戻る">
        <ArrowLeft :size="18" aria-hidden="true" />
      </RouterLink>
      <NotebookPen :size="18" class="head__icon" aria-hidden="true" />
      <div class="head__titles">
        <p class="head__title">プレイメモ</p>
        <p class="head__subtitle">{{ props.gameSessionTitle }}</p>
      </div>
      <span v-if="statusLabel" class="status" :class="statusVariant">
        <Check v-if="status === 'saved'" :size="14" aria-hidden="true" />
        {{ statusLabel }}
      </span>
    </div>

    <BaseAlert v-if="showLockedNotice" variant="warning">
      この卓は完了しました。本文の編集はここまでです。最後に保存された内容を表示しています。
    </BaseAlert>

    <BaseAlert v-else-if="!props.canEditBody" variant="warning">
      卓が完了したため本文は編集できません。公開・非公開の切り替えは引き続き行えます。
    </BaseAlert>

    <BaseAlert v-if="showFailedNotice" variant="error">
      保存できませんでした。通信を確認して、もう一度保存してください。書いた内容はこのページに残っています。
    </BaseAlert>

    <BaseAlert v-if="showVisibilityFailedNotice" variant="error">
      公開状態を切り替えられませんでした。通信を確認して、もう一度お試しください。
    </BaseAlert>

    <div class="visibility">
      <div class="visibility__state">
        <span class="badge" :class="{ 'badge--shared': props.isShared }">
          <component :is="visibilityIcon" :size="12" aria-hidden="true" />
          {{ visibilityLabel }}
        </span>
        <p class="visibility__description">{{ visibilityDescription }}</p>
      </div>
      <BaseSwitch
        label="メモを公開する"
        :model-value="props.isShared"
        :disabled="!props.canToggleVisibility || isVisibilitySaving"
        @update:model-value="onToggleVisibility"
      />
    </div>

    <p v-if="isReadOnly" class="readonly">{{ readonlyBody }}</p>

    <BaseTextArea
      v-else
      class="editor"
      :model-value="draftBody"
      :rows="18"
      resize="none"
      placeholder="プレイ中の気づきを書き留めましょう"
      @update:model-value="setDraft"
    />

    <div class="foot">
      <span class="counter" :class="{ 'counter--over': isOverLimit }">
        {{ counterLabel }}
      </span>
      <div class="foot__actions">
        <RouterLink :to="detailRoute" class="foot__back">卓へ戻る</RouterLink>
        <BaseButton
          v-if="!isReadOnly"
          :disabled="!canSaveNow"
          :loading="isSaving"
          @click="save"
        >
          保存
        </BaseButton>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.back {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
}

.back:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.head__icon {
  flex-shrink: 0;
  color: var(--color-primary-text);
}

.head__titles {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  min-width: 0;
}

.head__title {
  margin: 0;
  /* 幅が狭いときは卓名（副題）側を削る。見出しは折り返させない */
  flex-shrink: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 18px;
  font-weight: 500;
}

.head__subtitle {
  margin: 0;
  max-width: 100%;
  color: var(--color-text-muted);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 狭い画面では横に並べきれないので縦に積み、それぞれ1行で省略する */
@media (max-width: 600px) {
  .head__titles {
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
  }

  .head__title {
    flex-shrink: 1;
  }
}

.status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-left: auto;
  font-size: 12px;
  white-space: nowrap;
}

.status--ok {
  color: var(--color-success);
}

.status--ng {
  color: var(--color-error);
}

.status--muted {
  color: var(--color-text-muted);
}

.visibility {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);

  margin: var(--space-3) 0;
  padding: var(--space-3);

  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.visibility__state {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.visibility__description {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: var(--line-height-standard);
}

.badge {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--space-1);
  padding: 2px var(--space-2);

  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 12px;
  white-space: nowrap;
}

.badge--shared {
  border-color: var(--color-success);
  background: var(--color-success-soft);
  color: var(--color-success);
}

@media (max-width: 600px) {
  .visibility {
    flex-direction: column;
    align-items: flex-start;
  }
}

.editor :deep(.textarea-wrap__control) {
  min-height: 55vh;
  line-height: var(--line-height-relaxed);
}

.readonly {
  margin: 0;
  padding: var(--space-3);

  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.counter {
  color: var(--color-text-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.counter--over {
  color: var(--color-error);
  font-weight: 500;
}

.foot__actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.foot__back {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
</style>
