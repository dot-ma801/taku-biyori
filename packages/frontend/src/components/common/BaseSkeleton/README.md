# BaseSkeleton

コンテンツ読み込み中のプレースホルダーコンポーネント。シマーアニメーション付き。

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `string` | `'100%'` | 幅（CSS 値） |
| `height` | `string` | `'14px'` | 高さ（CSS 値） |
| `rounded` | `'sm' \| 'md' \| 'full'` | `'sm'` | 角丸スタイル |
| `lines` | `number` | `1` | 複数行表示（最終行は 70% 幅） |

## Usage

```vue
<!-- 見出し -->
<BaseSkeleton height="20px" width="40%" />

<!-- 3行テキスト -->
<BaseSkeleton :lines="3" height="14px" />

<!-- アバター + テキスト -->
<div style="display:flex; gap:12px; align-items:center;">
  <BaseSkeleton width="40px" height="40px" rounded="full" />
  <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
    <BaseSkeleton height="14px" width="40%" />
    <BaseSkeleton height="12px" width="60%" />
  </div>
</div>
```

## Design Notes

- シマーアニメーションは CSS グラデーション + `background-position` の 1.5s ループ
- 色は `--color-surface-muted` / `--color-surface-raised`（テーマ対応）
- 最終行が短い（70% 幅）のは自然な文章末尾を模倣
