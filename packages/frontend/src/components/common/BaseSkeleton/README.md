# BaseSkeleton

コンテンツ読み込み中のプレースホルダーコンポーネント。シマーアニメーション付き。

## Props

| Prop      | Type                     | Default  | Description                   |
| --------- | ------------------------ | -------- | ----------------------------- |
| `width`   | `string`                 | `'100%'` | 幅（CSS 値）                  |
| `height`  | `string`                 | `'14px'` | 高さ（CSS 値）                |
| `rounded` | `'sm' \| 'md' \| 'full'` | `'sm'`   | 角丸スタイル                  |
| `lines`   | `number`                 | `1`      | 複数行表示（最終行は 70% 幅） |

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

## 単体テスト項目

### レンダリング

- デフォルト props でレンダリングされること

### width / height

- `width` prop が style に反映されること
- `height` prop が style に反映されること

### rounded

- `rounded="sm"` / `"md"` / `"full"` それぞれで対応するクラスが付与されること

### lines

- `lines=1` のとき要素が 1 つ描画されること
- `lines=3` のとき要素が 3 つ描画されること
- 複数行のとき最終行の幅が 70% になること
- 複数行のとき最終行以外の幅が `width` prop の値になること

### アクセシビリティ

- ローディング中であることを示す `aria-busy="true"` が付与されること
- スクリーンリーダーに読み上げられないよう `aria-hidden="true"` が付与されること
