# BaseSelect

ドロップダウン選択コンポーネント。`@vuetify/v0` の `Select` をベースに、CSS Anchor Positioning による位置決めを使用します。

## Props

| Prop          | Type             | Required | Description                                                    |
| ------------- | ---------------- | -------- | -------------------------------------------------------------- |
| `options`     | `SelectOption[]` | ✓        | 選択肢の配列                                                   |
| `modelValue`  | `string`         | —        | v-model バインディング（`option.value`）                       |
| `label`       | `string`         | —        | フィールドラベル                                               |
| `placeholder` | `string`         | —        | 未選択時のプレースホルダー（デフォルト: `'選択してください'`） |
| `disabled`    | `boolean`        | —        | 操作を無効化                                                   |

## Types

```ts
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
```

## Usage

```vue
<BaseSelect
  v-model="selected"
  label="都道府県"
  :options="[
    { value: 'tokyo', label: '東京都' },
    { value: 'osaka', label: '大阪府' },
    { value: 'kyoto', label: '京都府', disabled: true },
  ]"
/>
```

## Design Notes

- ドロップダウンはネイティブ Popover API + CSS Anchor Positioning で位置決め
- 選択済み項目にチェックマーク（Lucide `Check`）を表示
- `v-model` は `option.value` を返し、表示ラベルは内部でルックアップ

## 単体テスト項目

### レンダリング

- `label` prop を渡したとき、ラベルテキストが表示されること
- `modelValue` が未選択のとき、`placeholder` テキストが表示されること

### options

- `options` の数だけ選択肢が表示されること（ドロップダウン開放後）
- `option.disabled=true` の選択肢が操作不能になること

### modelValue

- `modelValue` に対応する option のラベルがトリガーに表示されること
- 選択肢をクリックしたとき `update:modelValue` イベントが発火し、その option の `value` が渡されること
- 選択済み option にチェックマークが表示されること

### placeholder

- `modelValue` が空のとき `placeholder` が表示されること（デフォルト: `'選択してください'`）

### disabled

- `disabled=true` のときトリガーが操作不能になること
- `disabled=true` のとき操作してもドロップダウンが開かないこと

  > ⚠️ **テスト除外**
  > `@vuetify/v0` の `Select.Root` は fragment（複数ルート）としてレンダリングされるため、
  > `disabled` の状態が `Select.Activator` の button 要素に `disabled` 属性・`aria-disabled` 属性の
  > いずれとしても反映されないことを確認。内部的に CSS や `data-state` で制御していると考えられる。
  > **ブラウザ上の E2E テストで補完すること。**

### アクセシビリティ

- トリガーに `aria-haspopup="listbox"` が付与されていること
- ドロップダウンが閉じているとき `aria-expanded="false"`、開いているとき `aria-expanded="true"` になること
- ドロップダウンのリストに `role="listbox"` が付与されていること
- 各選択肢に `role="option"` が付与されていること
- 選択済み option に `aria-selected="true"` が付与されること
- `option.disabled=true` のとき `aria-disabled="true"` が付与されること
- `disabled=true` のときトリガーに `aria-disabled="true"` が付与されること
- `label` prop と トリガーが `aria-labelledby` または `aria-label` で紐付いていること
