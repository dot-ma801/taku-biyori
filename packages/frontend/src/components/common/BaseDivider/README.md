# BaseDivider

セクションを視覚的に区切る仕切り線コンポーネント。

## Props

| Prop       | Type      | Default | Description                              |
| ---------- | --------- | ------- | ---------------------------------------- |
| `label`    | `string`  | —       | 中央に表示するテキスト（例: `"または"`） |
| `vertical` | `boolean` | `false` | 縦方向の区切り線                         |

## Usage

```vue
<!-- 水平区切り線 -->
<BaseDivider />

<!-- ラベル付き（"または" などの区切り） -->
<BaseDivider label="または" />

<!-- 縦方向（flex コンテナ内で使用） -->
<div style="display:flex; height:40px; align-items:center;">
  <span>左</span>
  <BaseDivider vertical />
  <span>右</span>
</div>
```

## Design Notes

- 色は `--color-border`（テーマで自動切り替え）
- ラベル付きの場合は `<span>` + 両側に線を配置（flex レイアウト）

## 単体テスト項目

### レンダリング

- デフォルト props でレンダリングされること（水平、ラベルなし）

### label

- `label` prop がない場合、テキスト要素が表示されないこと
- `label` prop を渡したとき、テキストが中央に表示されること

### vertical

- `vertical=false` のとき水平区切り線として描画されること
- `vertical=true` のとき縦方向区切り線のクラスが付与されること

### アクセシビリティ

- `role="separator"` が付与されていること
- `vertical=true` のとき `aria-orientation="vertical"` が付与されること
- `label` prop があるときラベルテキストが `aria-label` として区切り線に付与されること
