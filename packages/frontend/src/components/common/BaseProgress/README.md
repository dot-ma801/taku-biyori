# BaseProgress

進捗バーコンポーネント。確定・不確定（indeterminate）の両モードをサポートします。

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | — | 現在値（0 〜 `max`） |
| `max` | `number` | `100` | 最大値 |
| `indeterminate` | `boolean` | `false` | 不確定（アニメーション）モード |
| `variant` | `'default' \| 'success' \| 'warning' \| 'error'` | `'default'` | 塗りの色 |
| `label` | `string` | — | バー左上のラベル |
| `showValue` | `boolean` | `false` | パーセンテージを右上に表示 |
| `size` | `'sm' \| 'md'` | `'md'` | バーの高さ（sm: 4px / md: 8px） |

## Usage

```vue
<!-- 確定 -->
<BaseProgress :value="uploadProgress" label="アップロード中" show-value />

<!-- 不確定 -->
<BaseProgress :indeterminate="true" label="処理中..." />

<!-- エラー状態 -->
<BaseProgress :value="85" variant="error" label="エラー率" />
```

## Design Notes

- `@vuetify/v0` の `Progress` コンポーネントをベースに使用
- 不確定モードは CSS キーフレームアニメーションで左→右スライド
- トラック色は `--color-surface-muted`

## 単体テスト項目

### レンダリング
- デフォルト props でレンダリングされること

### value / max
- `value=50`, `max=100` のときバーの幅が 50% になること
- `value=0` のときバーの幅が 0% になること
- `value=100` のときバーの幅が 100% になること
- `max=200`, `value=100` のときバーの幅が 50% になること
- `value` が負の値のとき、バーの幅が 0% にクランプされること
- `value` が `max` を超えるとき、バーの幅が 100% にクランプされること

### indeterminate
- `indeterminate=false` のときアニメーションクラスが付与されないこと
- `indeterminate=true` のときアニメーションクラスが付与されること

### variant
- `variant="default"` / `"success"` / `"warning"` / `"error"` それぞれで対応するクラスが付与されること

### label
- `label` prop を渡したとき、ラベルテキストが表示されること
- `label` prop がない場合、ラベル要素が表示されないこと

### showValue
- `showValue=false` のとき割合テキストが表示されないこと
- `showValue=true` のとき `50%` 形式で割合テキストが表示されること

### size
- `size="sm"` / `"md"` それぞれで対応するクラスが付与されること

### アクセシビリティ
- `role="progressbar"` が付与されていること
- `aria-valuenow` に現在値が反映されること
- `aria-valuemin="0"` が付与されていること
- `aria-valuemax` に `max` prop の値が反映されること
- `label` prop を渡したとき `aria-label` または `aria-labelledby` でラベルが提供されること
- `indeterminate=true` のとき `aria-valuenow` が除去されること
