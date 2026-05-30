# BaseBadge

ステータスやカテゴリを示すバッジコンポーネント。テキスト表示とドット表示の 2 形式があります。

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'error'` | `'default'` | 色バリアント |
| `dot` | `boolean` | `false` | ドット形式（テキストなし）で表示 |

## Usage

```vue
<!-- テキストバッジ -->
<BaseBadge variant="success">公開中</BaseBadge>
<BaseBadge variant="warning">レビュー待ち</BaseBadge>
<BaseBadge variant="error">要対応</BaseBadge>

<!-- ドット + テキスト -->
<span style="display:inline-flex; align-items:center; gap:6px;">
  <BaseBadge dot variant="success" />
  オンライン
</span>
```

## Design Notes

- 背景・テキスト色は `color-mix()` で生成されるためダーク/ライト両モード対応
- 角丸は `--radius-full`（pill 形状）
- フォントサイズ 11px、`letter-spacing: 0.03em`
