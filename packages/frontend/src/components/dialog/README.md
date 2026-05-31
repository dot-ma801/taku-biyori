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

## 単体テスト項目

### レンダリング
- 初期状態でダイアログが閉じていること（`open` 属性なし）
- `title` prop が dialog 内に表示されること

### 開閉
- `activator` スロットのトリガー要素をクリックするとダイアログが開くこと
- ダイアログが開いているとき `open` 属性が `<dialog>` に付与されること
- `actions` スロット内のボタンをクリックするとダイアログが閉じること
- Esc キーを押したとき、ダイアログが閉じること

### title / description
- `title` prop が `aria-labelledby` に対応する要素に表示されること
- `description` prop を渡したとき、サブテキストが表示されること
- `description` prop がない場合、サブテキスト要素が表示されないこと

### slots
- `default` スロットのコンテンツがダイアログ内に表示されること
- `actions` スロットのコンテンツがアクション領域に表示されること

### アクセシビリティ
- `<dialog>` 要素に `role="dialog"` と `aria-modal="true"` が付与されていること
- `title` prop が `aria-labelledby` で `<dialog>` に関連付けられていること
- `description` prop があるとき `aria-describedby` で `<dialog>` に関連付けられていること
- ダイアログが開いたとき、フォーカスがダイアログ内に移動すること
- ダイアログが閉じたとき、フォーカスが activator 要素に戻ること
- Tab キーによるフォーカスがダイアログ内に閉じること（フォーカストラップ）
