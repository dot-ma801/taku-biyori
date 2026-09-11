<script setup lang="ts">
import BaseTextArea from '@/components/form/BaseTextArea/BaseTextArea.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import type { GameSessionDraft } from '@/features/Lobby/Detail/Schedule/ConfirmFlow/useConfirmFlow';
import type { LobbyEntryModel } from '@/models/lobby';
import { memberDisplayName } from '@/utils/memberDisplayName';
import {
  getDraftFieldError,
  type GameSessionDraftField,
} from '@/features/Lobby/Detail/Schedule/ConfirmFlow/draftValidation';

/**
 * 確定の最終ステップ。決まった内容の確認と、この日だけの上書きを受け取る。
 *
 * 日付の整形は composable（useConfirmFlow）が済ませたものを受け取る。
 * ここで `formatDateWithWeekday` を呼ぶと、表示のための導出がコンポーネントに
 * 残ってしまう（CLAUDE.md「コンポーネントが持っていいもの」）。
 */
const props = defineProps<{
  /** 整形済みの開催日ラベル */
  scheduledAtLabel: string;
  selectedEntries: LobbyEntryModel[];
  draft: GameSessionDraft;
  /** ひとことの文字数カウンター。超過判定まで解決済みで受け取る */
  timeLabelCounter: { label: string; isOver: boolean };
}>();
const emit = defineEmits<{ 'update:draft': [draft: GameSessionDraft] }>();

// API の契約（CreateGameSessionInputSchema の max）と同じ基準で、**全項目**を弾く。
// 送信してから 400 になると「日程の確定に失敗しました」としか出ず、
// どこを直せばよいか利用者に分からない
const rulesFor = (field: GameSessionDraftField) => [
  (v: unknown) => getDraftFieldError(field, (v as string) ?? '') ?? true,
];

function update<K extends keyof GameSessionDraft>(
  key: K,
  value: GameSessionDraft[K],
) {
  emit('update:draft', { ...props.draft, [key]: value });
}
</script>

<template>
  <div class="review">
    <div>
      <span class="label">開催日</span>
      <p class="date">{{ scheduledAtLabel }}</p>
    </div>
    <div>
      <span class="label">当日の参加者（{{ selectedEntries.length }}名）</span>
      <ul>
        <li v-for="entry in selectedEntries" :key="entry.id">
          {{ memberDisplayName(entry) }}
        </li>
      </ul>
    </div>

    <!--
      ロビーの値へフォールバックするのは title / scenarioName / location だけ
      （shared の resolveGameSessionDisplay）。時間帯と連絡事項に卓側の既定値は無いので、
      ヒントの対象に含めると「空欄にすれば引き継がれる」と誤読される
    -->
    <p class="hint">
      名前・シナリオ・場所は、空欄のままなら卓の設定をそのまま使います。
    </p>
    <BaseTextBox
      :model-value="draft.title"
      label="卓名（任意）"
      :rules="rulesFor('title')"
      @update:model-value="update('title', $event)"
    />
    <BaseTextBox
      :model-value="draft.scenarioName"
      label="シナリオ名（任意）"
      :rules="rulesFor('scenarioName')"
      @update:model-value="update('scenarioName', $event)"
    />
    <BaseTextBox
      :model-value="draft.location"
      label="場所（任意）"
      :rules="rulesFor('location')"
      @update:model-value="update('location', $event)"
    />

    <p class="hint">次の2つは、この日のためだけの情報です。</p>
    <div class="field">
      <BaseTextBox
        :model-value="draft.timeLabel"
        label="時間帯（任意）"
        placeholder="例）19:00〜 / 午後から"
        :rules="rulesFor('timeLabel')"
        @update:model-value="update('timeLabel', $event)"
      />
      <span
        class="counter"
        :class="{ 'counter--over': timeLabelCounter.isOver }"
      >
        {{ timeLabelCounter.label }}
      </span>
    </div>
    <BaseTextArea
      :model-value="draft.description"
      label="当日の連絡事項（任意）"
      :rows="3"
      :rules="rulesFor('description')"
      @update:model-value="update('description', $event)"
    />
  </div>
</template>

<style scoped>
.review {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  font-size: 14px;
}
.label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
}
.date {
  margin: var(--space-1) 0 0;
  font-size: 16px;
  font-weight: 500;
}
ul {
  margin: var(--space-1) 0 0;
  padding-left: 1.2em;
}
.hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 13px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 候補日の入力（InputScheduleInfo）と同じ `N / MAX` 形式に揃える */
.counter {
  align-self: flex-start;
  color: var(--color-text-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.counter--over {
  color: var(--color-error);
  font-weight: 500;
}
</style>
