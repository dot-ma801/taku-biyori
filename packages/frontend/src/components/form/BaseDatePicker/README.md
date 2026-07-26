# BaseDatePicker

ポップオーバーカレンダーで日付を選択するコンポーネント。

## Props

| Prop          | Type      | Default        | Description                        |
| ------------- | --------- | -------------- | ---------------------------------- |
| `required`    | `boolean` | `false`        | ラベルに必須マーク（`*`）を表示    |
| `label`       | `string`  | —              | ラベル文字列                       |
| `placeholder` | `string`  | `'日付を選択'` | 未選択時のプレースホルダー         |
| `disabled`    | `boolean` | `false`        | 無効化                             |
| `min`         | `string`  | —              | 選択可能な最小日付（`YYYY-MM-DD`） |
| `max`         | `string`  | —              | 選択可能な最大日付（`YYYY-MM-DD`） |
| `disablePast` | `boolean` | `false`        | 今日より前の日付を選択不可にする   |
| `multiple`    | `boolean` | `false`        | 複数日選択モード（v-model は配列） |
| `clearable`   | `boolean` | `false`        | 選択済みの値を消すボタンを表示     |

## Model

| v-model      | Type     | Description                         |
| ------------ | -------- | ----------------------------------- |
| `modelValue` | `string` | 選択された日付（`YYYY-MM-DD` 形式） |

## Usage

```vue
<BaseDatePicker
  v-model="date"
  label="開催日"
  min="2025-01-01"
  max="2025-12-31"
/>

<!-- 任意入力の項目は clearable を付け、選択後に未選択へ戻せるようにする -->
<BaseDatePicker v-model="openUntil" label="募集締め切り日" clearable />
```

## Design Notes

- `@vuetify/v0` の `Popover` をポップオーバー制御に活用
- カレンダーロジックはネイティブ `Date` で実装
- 日・土曜日に色分けあり（日=エラー色、土=プライマリ色）
- 今日の日付は太字+プライマリカラーでハイライト
- クリアボタンはトリガー（`Popover.Activator` が描画する `button`）に入れ子にできないため、
  兄弟要素として重ねて配置する。押してもカレンダーは開かない
- 任意入力の項目では `clearable` を付けること。付けないと一度選んだ日付を未選択に戻せない

## 単体テスト項目

### レンダリング

- デフォルト props でレンダリングされること
- `label` が表示されること
- `label` が未指定のとき label 要素が表示されないこと

### トリガーボタン

- 値未選択のときプレースホルダーが表示されること
- 値が選択済みのとき日付ラベルが表示されること

### required

- `required=true` のときラベルに必須マークが表示されること
- `required` 未指定のとき必須マークが表示されないこと

### clearable

- `clearable=true` かつ値が選択済みのときクリアボタンが表示されること
- `clearable=true` でも未選択のときはクリアボタンが表示されないこと
- `clearable` 未指定のときはクリアボタンが表示されないこと
- `disabled` のときはクリアボタンが表示されないこと
- クリアボタンを押すと空文字が emit されること
- `multiple=true` でクリアボタンを押すと空配列が emit されること
- クリアボタンがトリガーの外側に置かれること（押してもカレンダーが開かない）

### disabled

- `disabled` のときトリガーボタンが無効化されること

### disablePast

- `disablePast` のとき今日より前の日付セルが選択不可になること
- `disablePast` のとき今日以降の日付セルは選択可能なままであること
- `disablePast` 未指定のとき過去日でも選択可能であること

### アクセシビリティ

- トリガーボタンに `aria-label` が付与されていること
- `label` 未指定でもトリガーボタンに `aria-label` が付与されていること
- クリアボタンに `aria-label` が付与されていること
