<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, onBeforeRouteLeave } from 'vue-router';
import { ArrowLeft, Check, NotebookPen } from '@lucide/vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseAlert from '@/components/common/BaseAlert/BaseAlert.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import BaseTextArea from '@/components/form/BaseTextArea/BaseTextArea.vue';
import { usePlayMemoEdit } from '@/features/GameSession/PlayMemo/usePlayMemoEdit';
import type { MyGameSessionPlayMemo } from '@taku-biyori/shared';

const props = defineProps<{
  gameSessionId: string;
  gameSessionTitle: string;
  playMemo: MyGameSessionPlayMemo | null;
  canEditBody: boolean;
}>();

const emit = defineEmits<{
  saved: [saved: MyGameSessionPlayMemo];
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
  flush,
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
    dirty: '編集中…',
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

const overLimitLeaveMessage = computed(
  () =>
    `本文が上限（${maxLength.toLocaleString()}文字）を超えています。文字数を減らしてから離れてください。`,
);
const dirtyLeaveMessage =
  '保存できていない変更があります。このページを離れると失われます。よろしいですか？';

// 自動保存がある画面で毎回離脱確認を出すのは筋が悪いため、まず保存を試み、
// 失敗したときだけ確認する。
// NOTE: 確認 UI はプロジェクトのダイアログに寄せる余地があるが、
//       ナビゲーションガードの中で解決を待つ必要があるため今は confirm を使う。
onBeforeRouteLeave(async () => {
  if (isReadOnly.value) return true;

  const saved = await flush();
  if (saved) return true;

  // 上限超過は自動保存も止まっている状態なので、なぜ保存できないのかが
  // 伝わるよう文言を出し分ける。
  return window.confirm(
    isOverLimit.value ? overLimitLeaveMessage.value : dirtyLeaveMessage,
  );
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
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
}

.back:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.head__icon {
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
  font-size: 18px;
  font-weight: 500;
}

.head__subtitle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
