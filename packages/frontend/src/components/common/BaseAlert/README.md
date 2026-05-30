# BaseAlert

文脈的フィードバックメッセージコンポーネント。情報・成功・警告・エラーの 4 バリアントをサポートします。

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | 表示バリアント |
| `title` | `string` | — | 太字タイトル |
| `dismissible` | `boolean` | `false` | 閉じるボタンを表示 |

## Events

| Event | Description |
|-------|-------------|
| `dismiss` | 閉じるボタンがクリックされたとき |

## Usage

```vue
<BaseAlert variant="success" title="保存完了">
  データが正常に保存されました。
</BaseAlert>

<BaseAlert variant="error" title="エラー" dismissible @dismiss="hideAlert">
  接続に失敗しました。再度お試しください。
</BaseAlert>
```

## Design Notes

- 背景・ボーダーは `color-mix()` で CSS 変数から生成されるためダーク/ライト両モード対応
- アイコンは Lucide（Info / CheckCircle / AlertTriangle / AlertCircle）
