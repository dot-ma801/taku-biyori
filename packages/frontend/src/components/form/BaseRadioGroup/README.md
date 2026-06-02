# BaseRadioGroup

ラジオボタングループコンポーネント。単一選択を強制します。

## Props

| Prop         | Type                | Default    | Description                                       |
| ------------ | ------------------- | ---------- | ------------------------------------------------- |
| `modelValue` | `string`            | —          | v-model バインディング（選択中の `option.value`） |
| `options`    | `RadioOption[]`     | —          | 選択肢の配列                                      |
| `label`      | `string`            | —          | グループのラベル（`<legend>` として描画）         |
| `disabled`   | `boolean`           | —          | グループ全体を無効化                              |
| `direction`  | `'row' \| 'column'` | `'column'` | 並び方向                                          |

## Types

```ts
interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
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

## 単体テスト項目

### レンダリング

- `options` の数だけラジオボタンが表示されること
- 各 option の `label` がラジオボタン横に表示されること

### label

- `label` prop を渡したとき、`<legend>` としてグループラベルが表示されること

### modelValue

- `modelValue` に一致する option がチェック済み状態になること
- ラジオボタンをクリックしたとき `update:modelValue` イベントが発火し、その option の `value` が渡されること

### disabled（グループ）

- `disabled=true` のとき全ラジオボタンが操作不能になること
- `disabled=true` のときクリックしても `update:modelValue` イベントが発火しないこと

### disabled（個別 option）

- `option.disabled=true` の選択肢が操作不能になること
- 無効な選択肢をクリックしても `update:modelValue` イベントが発火しないこと

### direction

- `direction="column"` のとき縦並びレイアウトのクラスが付与されること
- `direction="row"` のとき横並びレイアウトのクラスが付与されること

### アクセシビリティ

- グループに `role="radiogroup"` が付与されていること
- 各ラジオボタンに `role="radio"` が付与されていること
- 選択中のラジオボタンに `aria-checked="true"` が付与されること
- 未選択のラジオボタンに `aria-checked="false"` が付与されること
- `label` prop が `<legend>` としてグループにアクセシブルなラベルを提供していること
- `disabled=true`（グループ）のとき全ラジオボタンに `aria-disabled="true"` が付与されること
- `option.disabled=true` のとき該当ラジオボタンに `aria-disabled="true"` が付与されること
