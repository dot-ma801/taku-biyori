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
