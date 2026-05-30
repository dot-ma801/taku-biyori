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
