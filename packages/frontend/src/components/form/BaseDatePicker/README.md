# BaseDatePicker

ポップオーバーカレンダーで日付を選択するコンポーネント。

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | ラベル文字列 |
| `placeholder` | `string` | `'日付を選択'` | 未選択時のプレースホルダー |
| `disabled` | `boolean` | `false` | 無効化 |
| `min` | `string` | — | 選択可能な最小日付（`YYYY-MM-DD`） |
| `max` | `string` | — | 選択可能な最大日付（`YYYY-MM-DD`） |

## Model

| v-model | Type | Description |
|---------|------|-------------|
| `modelValue` | `string` | 選択された日付（`YYYY-MM-DD` 形式） |

## Usage

```vue
<BaseDatePicker
  v-model="date"
  label="開催日"
  min="2025-01-01"
  max="2025-12-31"
/>
```

## Design Notes

- `@vuetify/v0` の `Popover` をポップオーバー制御に活用
- カレンダーロジックはネイティブ `Date` で実装
- 日・土曜日に色分けあり（日=エラー色、土=プライマリ色）
- 今日の日付は太字+プライマリカラーでハイライト

## 単体テスト項目

### レンダリング
- デフォルト props でレンダリングされること
- `label` が表示されること
- `label` が未指定のとき label 要素が表示されないこと

### トリガーボタン
- 値未選択のときプレースホルダーが表示されること
- 値が選択済みのとき日付ラベルが表示されること

### disabled
- `disabled` のときトリガーボタンが無効化されること

### アクセシビリティ
- トリガーボタンに `aria-label` が付与されていること
- `label` 未指定でもトリガーボタンに `aria-label` が付与されていること
