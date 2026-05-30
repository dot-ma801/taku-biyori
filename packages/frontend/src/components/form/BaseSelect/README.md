# BaseSelect

ドロップダウン選択コンポーネント。`@vuetify/v0` の `Select` をベースに、CSS Anchor Positioning による位置決めを使用します。

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `SelectOption[]` | ✓ | 選択肢の配列 |
| `modelValue` | `string` | — | v-model バインディング（`option.value`） |
| `label` | `string` | — | フィールドラベル |
| `placeholder` | `string` | — | 未選択時のプレースホルダー（デフォルト: `'選択してください'`） |
| `disabled` | `boolean` | — | 操作を無効化 |

## Types

```ts
interface SelectOption {
  value: string
  label: string
  disabled?: boolean
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
