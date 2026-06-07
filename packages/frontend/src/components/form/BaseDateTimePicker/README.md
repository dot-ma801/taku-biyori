# BaseDateTimePicker

ネイティブの `input[type="datetime-local"]` を使った日時入力コンポーネント。

## Props

| Prop          | Type      | Default | Description                              |
| ------------- | --------- | ------- | ---------------------------------------- |
| `label`       | `string`  | —       | ラベル文字列                             |
| `placeholder` | `string`  | —       | プレースホルダー                         |
| `hint`        | `string`  | —       | 補足テキスト                             |
| `rules`       | `Rule[]`  | —       | バリデーションルール                     |
| `disabled`    | `boolean` | `false` | 無効化                                   |
| `readonly`    | `boolean` | `false` | 読み取り専用                             |
| `min`         | `string`  | —       | 入力可能な最小日時（`YYYY-MM-DDTHH:mm`） |
| `max`         | `string`  | —       | 入力可能な最大日時（`YYYY-MM-DDTHH:mm`） |

## Model

| v-model      | Type     | Description                               |
| ------------ | -------- | ----------------------------------------- |
| `modelValue` | `string` | 選択された日時（`YYYY-MM-DDTHH:mm` 形式） |

## Usage

```vue
<BaseDateTimePicker
  v-model="datetime"
  label="開催日時"
  hint="開催予定の日時を入力してください"
  :rules="[(v) => !!v || '日時を入力してください']"
/>
```

## Design Notes

- `@vuetify/v0` の `Input` コンポーネントをロジック層として活用
- スタイルは `BaseTextBox` と共通のデザイントークンを使用

## 単体テスト項目

### レンダリング

- デフォルト props でレンダリングされること
- `label` が表示されること
- `label` が未指定のとき label 要素が表示されないこと

### input type

- input の type が `datetime-local` になっていること

### hint

- `hint` が指定されたとき表示されること
- `hint` が未指定のとき hint 要素が表示されないこと

### disabled

- `disabled` のとき input が無効化されること

### アクセシビリティ

- input 要素が存在すること
