# BaseCheckbox

チェックボックスコンポーネント。`@vuetify/v0` の `Checkbox` をベースに実装しています。

## Props

| Prop         | Type      | Default | Description                        |
| ------------ | --------- | ------- | ---------------------------------- |
| `modelValue` | `boolean` | `false` | v-model バインディング             |
| `label`      | `string`  | —       | チェックボックス横のラベルテキスト |
| `value`      | `string`  | —       | グループ内使用時の値               |
| `disabled`   | `boolean` | —       | 操作を無効化                       |

## Usage

```vue
<!-- 単独使用 -->
<BaseCheckbox v-model="agreed" label="利用規約に同意する" />

<!-- スロットでカスタムラベル -->
<BaseCheckbox v-model="agreed">
  <span><a href="/terms">利用規約</a>に同意する</span>
</BaseCheckbox>
```

## Design Notes

- チェック時は `--color-primary` の背景 + 白チェックアイコン（Lucide `Check`）
- 角丸は `--radius-sm`（4px）でラジオボタンと視覚的に区別

## 単体テスト項目

### レンダリング

- デフォルト props でレンダリングされること（`modelValue=false`）

### label

- `label` prop を渡したとき、ラベルテキストが表示されること
- `default` スロットを渡したとき、スロットコンテンツがラベル領域に表示されること

### modelValue

- `modelValue=false` のとき未チェック状態（チェックアイコンなし）でレンダリングされること
- `modelValue=true` のときチェック済み状態（チェックアイコンあり）でレンダリングされること
- クリックしたとき `update:modelValue` イベントが発火し、値が反転すること

### disabled

- `disabled=true` のとき `disabled` 属性が付与されること
- `disabled=true` のときクリックしても `update:modelValue` イベントが発火しないこと

### アクセシビリティ

- `role="checkbox"` が付与されていること
- `aria-checked` が `modelValue` の値（`"true"` / `"false"`）に対応して付与されること
- `label` prop と チェックボックスが `for`/`id` または `aria-labelledby` で紐付いていること
- `disabled=true` のとき `aria-disabled="true"` が付与されること
