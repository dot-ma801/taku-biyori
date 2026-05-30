# BaseRadioGroup

ラジオボタングループコンポーネント。単一選択を強制します。

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string` | — | v-model バインディング（選択中の `option.value`） |
| `options` | `RadioOption[]` | — | 選択肢の配列 |
| `label` | `string` | — | グループのラベル（`<legend>` として描画） |
| `disabled` | `boolean` | — | グループ全体を無効化 |
| `direction` | `'row' \| 'column'` | `'column'` | 並び方向 |

## Types

```ts
interface RadioOption {
  value: string
  label: string
  disabled?: boolean
}
```

## Usage

```vue
<BaseRadioGroup
  v-model="plan"
  label="プランを選択"
  direction="row"
  :options="[
    { value: 'free', label: 'フリー' },
    { value: 'pro', label: 'プロ' },
    { value: 'enterprise', label: 'エンタープライズ' },
  ]"
/>
```

## Design Notes

- ラジオの円形表示は `<span>` ラッパーで実現（`Radio.Root` の inheritAttrs に依存しない）
- 選択状態の枠色変更は CSS `:has([data-state='checked'])` で実現
