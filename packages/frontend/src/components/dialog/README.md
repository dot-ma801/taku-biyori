# BaseDialog

モーダルダイアログコンポーネント。`@vuetify/v0` の `Dialog` ヘッドレスコンポーネントをベースに、ネイティブ `<dialog>` 要素でアクセシブルに実装しています。

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | ✓ | ダイアログのタイトル（aria-labelledby に使用） |
| `description` | `string` | — | タイトル直下のサブテキスト（aria-describedby に使用） |

## Slots

| Slot | Description |
|------|-------------|
| `activator` | ダイアログを開くトリガー要素（必須）。`Dialog.Activator` でラップされます |
| `default` | ダイアログ本文 |
| `actions` | 右下に配置されるアクションボタン群。クリックで自動クローズ |

## Usage

```vue
<BaseDialog title="削除の確認" description="この操作は取り消せません。">
  <template #activator>
    <BaseButton variant="secondary">削除する</BaseButton>
  </template>

  <p>選択したデータを削除しますか？</p>

  <template #actions>
    <BaseButton variant="ghost" size="sm">キャンセル</BaseButton>
    <BaseButton variant="primary" size="sm" @click="handleDelete">削除</BaseButton>
  </template>
</BaseDialog>
```

## Design Notes

- 開閉は `Dialog.Activator` スロット経由のみ（`v-model:open` は `Dialog.Root` 非対応）
- `actions` スロット内のボタンはクリックで自動クローズ（`Dialog.Close` ラップ済み）
- Esc キーでも閉じられます（ネイティブ dialog の仕様）
- 最大幅 480px、画面幅に応じてレスポンシブ対応
