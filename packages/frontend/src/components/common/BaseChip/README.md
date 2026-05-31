# BaseChip

選択トグル・フィルタータグとして使用するチップコンポーネント。

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selected` | `boolean` | `false` | v-model:selected バインディング |
| `removable` | `boolean` | `false` | 削除ボタン（X アイコン）を表示 |
| `disabled` | `boolean` | `false` | 操作を無効化 |

## Events

| Event | Description |
|-------|-------------|
| `update:selected` | 選択状態が変化したとき |
| `remove` | 削除ボタンがクリックされたとき |

## Usage

```vue
<!-- 選択トグル -->
<BaseChip v-model:selected="isActive">フロントエンド</BaseChip>

<!-- 削除可能タグ -->
<BaseChip
  v-for="tag in tags"
  :key="tag"
  :selected="true"
  removable
  @remove="removeTag(tag)"
>{{ tag }}</BaseChip>
```

## Design Notes

- 選択時: `color-mix()` によるプライマリカラーのティント背景
- 未選択時: `surface` 背景 + `border-strong` ボーダー
- 角丸は `--radius-full`（完全な pill 形状）
- 削除アイコンは Lucide `X`（12px）

## 単体テスト項目

### レンダリング
- デフォルト props でレンダリングされること（`selected=false`, `removable=false`, `disabled=false`）
- スロットのテキストが表示されること

### selected
- `selected=false` のとき未選択スタイルのクラスが付与されること
- `selected=true` のとき選択済みスタイルのクラスが付与されること
- チップをクリックしたとき `update:selected` イベントが発火し、値が反転すること

### removable
- `removable=false` のとき削除ボタンが表示されないこと
- `removable=true` のとき削除ボタンが表示されること
- 削除ボタンをクリックしたとき `remove` イベントが発火すること

### disabled
- `disabled=true` のとき操作不能クラスまたは属性が付与されること
- `disabled=true` のときクリックしても `update:selected` イベントが発火しないこと
- `disabled=true` のとき削除ボタンをクリックしても `remove` イベントが発火しないこと

### アクセシビリティ
- `aria-pressed` が選択状態（`selected`）に応じて `"true"` / `"false"` で付与されること
- `disabled=true` のとき `aria-disabled="true"` が付与されること
- `removable=true` のとき削除ボタンにアクセシブルなラベル（`aria-label` 等）が付与されていること
