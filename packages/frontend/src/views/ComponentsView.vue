<script setup lang="ts">
import { ref } from 'vue';

import BaseButton from '@/components/button/BaseButton.vue';
import BaseDialog from '@/components/dialog/BaseDialog.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import BaseTextArea from '@/components/form/BaseTextArea/BaseTextArea.vue';
import BaseCheckbox from '@/components/form/BaseCheckbox/BaseCheckbox.vue';
import BaseSwitch from '@/components/form/BaseSwitch/BaseSwitch.vue';
import BaseSelect from '@/components/form/BaseSelect/BaseSelect.vue';
import BaseRadioGroup from '@/components/form/BaseRadioGroup/BaseRadioGroup.vue';
import BaseChip from '@/components/common/BaseChip/BaseChip.vue';
import BaseAlert from '@/components/common/BaseAlert/BaseAlert.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseTabs from '@/components/common/BaseTabs/BaseTabs.vue';
import BaseProgress from '@/components/common/BaseProgress/BaseProgress.vue';
import BaseCollapsible from '@/components/common/BaseCollapsible/BaseCollapsible.vue';
import BaseDivider from '@/components/common/BaseDivider/BaseDivider.vue';
import BaseSkeleton from '@/components/common/BaseSkeleton/BaseSkeleton.vue';
import BaseBadge from '@/components/common/BaseBadge/BaseBadge.vue';
import { useToast } from '@/composables/useToast';

const toast = useToast();

// Form state
const textValue = ref('');
const textAreaValue = ref('');
const checked = ref(false);
const switchOn = ref(false);
const selectedFruit = ref('');
const selectedRadio = ref('a');
const chipSelected = ref(true);
const activeTab = ref('overview');
const progressValue = ref(65);

const fruitOptions = [
  { value: 'apple', label: 'りんご' },
  { value: 'banana', label: 'バナナ' },
  { value: 'cherry', label: 'さくらんぼ' },
  { value: 'grape', label: 'ぶどう', disabled: true },
];

const radioOptions = [
  { value: 'a', label: 'オプション A' },
  { value: 'b', label: 'オプション B' },
  { value: 'c', label: 'オプション C' },
];

const tabs = [
  { value: 'overview', label: '概要' },
  { value: 'details', label: '詳細' },
  { value: 'settings', label: '設定', disabled: true },
];

const emailRules = [
  (v: unknown) => !!v || 'メールアドレスは必須です',
  (v: unknown) =>
    /.+@.+\..+/.test(v as string) || 'メールアドレスの形式が正しくありません',
];
</script>

<template>
  <div class="sandbox">
    <header class="sandbox__header">
      <h1 class="sandbox__title">コンポーネント一覧</h1>
      <p class="sandbox__desc">
        デザインシステムの基本コンポーネント動作確認用ページ
      </p>
    </header>

    <!-- Buttons -->
    <section class="section">
      <h2 class="section__title">Button</h2>
      <div class="row">
        <BaseButton variant="primary">Primary</BaseButton>
        <BaseButton variant="secondary">Secondary</BaseButton>
        <BaseButton variant="ghost">Ghost</BaseButton>
        <BaseButton variant="primary" :loading="true">Loading</BaseButton>
        <BaseButton variant="primary" :disabled="true">Disabled</BaseButton>
        <BaseButton variant="primary" size="sm">Small</BaseButton>
      </div>
    </section>

    <BaseDivider />

    <!-- Badges -->
    <section class="section">
      <h2 class="section__title">Badge</h2>
      <div class="row">
        <BaseBadge>Default</BaseBadge>
        <BaseBadge variant="primary">Primary</BaseBadge>
        <BaseBadge variant="success">Success</BaseBadge>
        <BaseBadge variant="warning">Warning</BaseBadge>
        <BaseBadge variant="error">Error</BaseBadge>
        <span
          style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
          "
        >
          <BaseBadge dot variant="success" /> オンライン
        </span>
      </div>
    </section>

    <BaseDivider />

    <!-- Chips -->
    <section class="section">
      <h2 class="section__title">Chip</h2>
      <div class="row">
        <BaseChip v-model:selected="chipSelected">選択可能</BaseChip>
        <BaseChip :selected="true">選択済み</BaseChip>
        <BaseChip :selected="false">未選択</BaseChip>
        <BaseChip :selected="true" removable @remove="() => {}"
          >削除可能</BaseChip
        >
        <BaseChip :selected="false" :disabled="true">無効</BaseChip>
      </div>
    </section>

    <BaseDivider />

    <!-- Alerts -->
    <section class="section">
      <h2 class="section__title">Alert</h2>
      <div class="col">
        <BaseAlert variant="info" title="情報">操作が完了しました。</BaseAlert>
        <BaseAlert variant="success" title="成功"
          >データが正常に保存されました。</BaseAlert
        >
        <BaseAlert variant="warning" title="警告" dismissible
          >この操作は取り消しできません。</BaseAlert
        >
        <BaseAlert variant="error" title="エラー"
          >接続に失敗しました。再度お試しください。</BaseAlert
        >
      </div>
    </section>

    <BaseDivider />

    <!-- Toast -->
    <section class="section">
      <h2 class="section__title">Toast</h2>
      <div class="row">
        <BaseButton
          variant="secondary"
          size="sm"
          @click="toast.info('情報メッセージです')"
          >Info</BaseButton
        >
        <BaseButton
          variant="secondary"
          size="sm"
          @click="toast.success('正常に保存されました')"
          >Success</BaseButton
        >
        <BaseButton
          variant="secondary"
          size="sm"
          @click="toast.warning('この操作には注意が必要です')"
          >Warning</BaseButton
        >
        <BaseButton
          variant="secondary"
          size="sm"
          @click="toast.error('エラーが発生しました')"
          >Error</BaseButton
        >
      </div>
    </section>

    <BaseDivider />

    <!-- Card -->
    <section class="section">
      <h2 class="section__title">Card</h2>
      <div class="grid-2">
        <BaseCard title="シンプルなカード" subtitle="サブタイトルが入ります">
          カードのコンテンツがここに入ります。テキストやコンポーネントを自由に配置できます。
        </BaseCard>
        <BaseCard title="アクション付き" hoverable>
          カードの本文テキスト。ホバーすると影が付きます。
          <template #actions>
            <BaseButton variant="ghost" size="sm">キャンセル</BaseButton>
            <BaseButton variant="primary" size="sm">確認</BaseButton>
          </template>
        </BaseCard>
      </div>
    </section>

    <BaseDivider />

    <!-- Tabs -->
    <section class="section">
      <h2 class="section__title">Tabs</h2>
      <BaseTabs v-model="activeTab" :tabs="tabs">
        <template #overview>
          <p>
            概要タブのコンテンツです。ここにプロジェクトの概要説明が入ります。
          </p>
        </template>
        <template #details>
          <p>詳細タブのコンテンツです。より詳しい情報がここに表示されます。</p>
        </template>
      </BaseTabs>
    </section>

    <BaseDivider />

    <!-- Collapsible -->
    <section class="section">
      <h2 class="section__title">Collapsible</h2>
      <div class="col">
        <BaseCollapsible title="よくある質問 1" :default-open="true">
          これはアコーディオンのコンテンツです。詳細情報が折りたたまれています。
        </BaseCollapsible>
        <BaseCollapsible title="よくある質問 2">
          別のアコーディオンアイテムです。開閉状態は独立しています。
        </BaseCollapsible>
      </div>
    </section>

    <BaseDivider />

    <!-- Progress -->
    <section class="section">
      <h2 class="section__title">Progress</h2>
      <div class="col">
        <BaseProgress
          :value="progressValue"
          label="アップロード中"
          show-value
        />
        <BaseProgress :value="40" variant="success" label="成功" />
        <BaseProgress :value="70" variant="warning" label="警告" size="sm" />
        <BaseProgress :value="85" variant="error" label="エラー" size="sm" />
        <BaseProgress :indeterminate="true" label="処理中..." />
      </div>
      <div class="row" style="margin-top: var(--space-3)">
        <BaseButton
          variant="ghost"
          size="sm"
          @click="progressValue = Math.max(0, progressValue - 10)"
          >−10</BaseButton
        >
        <BaseButton
          variant="ghost"
          size="sm"
          @click="progressValue = Math.min(100, progressValue + 10)"
          >+10</BaseButton
        >
      </div>
    </section>

    <BaseDivider />

    <!-- Skeleton -->
    <section class="section">
      <h2 class="section__title">Skeleton</h2>
      <div class="col" style="max-width: 400px">
        <BaseSkeleton height="20px" width="60%" />
        <BaseSkeleton :lines="3" height="14px" />
        <div style="display: flex; gap: var(--space-3); align-items: center">
          <BaseSkeleton width="40px" height="40px" rounded="full" />
          <div style="flex: 1; display: flex; flex-direction: column; gap: 6px">
            <BaseSkeleton height="14px" width="40%" />
            <BaseSkeleton height="12px" width="70%" />
          </div>
        </div>
      </div>
    </section>

    <BaseDivider />

    <!-- Forms -->
    <section class="section">
      <h2 class="section__title">Form</h2>
      <div class="col" style="max-width: 480px">
        <BaseTextBox
          v-model="textValue"
          label="メールアドレス"
          placeholder="example@email.com"
          :rules="emailRules"
          hint="ログインに使用するメールアドレス"
        />
        <BaseTextArea
          v-model="textAreaValue"
          label="メモ"
          placeholder="自由記述..."
          hint="最大 500 文字"
        />
        <BaseSelect
          v-model="selectedFruit"
          :options="fruitOptions"
          label="フルーツを選択"
          placeholder="選択してください"
        />
        <BaseRadioGroup
          v-model="selectedRadio"
          :options="radioOptions"
          label="オプション"
          direction="row"
        />
        <div class="row">
          <BaseCheckbox v-model="checked" label="利用規約に同意する" />
        </div>
        <div class="row">
          <BaseSwitch v-model="switchOn" label="通知を有効にする" />
        </div>
        <div class="row">
          <BaseButton variant="primary" type="submit">送信</BaseButton>
          <BaseButton variant="ghost">リセット</BaseButton>
        </div>
      </div>
    </section>

    <BaseDivider />

    <!-- Dialog -->
    <section class="section">
      <h2 class="section__title">Dialog</h2>
      <div class="row">
        <BaseDialog
          title="確認"
          description="この操作を実行してよろしいですか？"
        >
          <template #activator>
            <BaseButton variant="secondary">ダイアログを開く</BaseButton>
          </template>
          <p
            style="
              font-size: 14px;
              color: var(--color-text-secondary);
              margin: 0;
            "
          >
            削除したデータは復元できません。続行する場合は「実行」を押してください。
          </p>
          <template #actions>
            <BaseButton variant="ghost" size="sm">キャンセル</BaseButton>
            <BaseButton
              variant="primary"
              size="sm"
              @click="toast.success('実行されました')"
              >実行</BaseButton
            >
          </template>
        </BaseDialog>

        <BaseDialog title="シンプルなダイアログ">
          <template #activator>
            <BaseButton variant="secondary">別のダイアログ</BaseButton>
          </template>
          <p
            style="
              font-size: 14px;
              color: var(--color-text-secondary);
              margin: 0;
            "
          >
            Dialog.Activator スロット経由で開くダイアログです。
          </p>
        </BaseDialog>
      </div>
    </section>

    <BaseDivider />

    <!-- Divider -->
    <section class="section">
      <h2 class="section__title">Divider</h2>
      <div class="col">
        <BaseDivider />
        <BaseDivider label="または" />
        <div
          style="
            display: flex;
            height: 40px;
            align-items: center;
            gap: var(--space-4);
          "
        >
          <span style="font-size: 13px">左</span>
          <BaseDivider :vertical="true" />
          <span style="font-size: 13px">右</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.sandbox {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
  font-family: var(--font-family-base);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.sandbox__header {
  margin-bottom: var(--space-2);
}
.sandbox__title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 var(--space-1);
  letter-spacing: -0.015em;
}
.sandbox__desc {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.section__title {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin: 0;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}
.col {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}
</style>
