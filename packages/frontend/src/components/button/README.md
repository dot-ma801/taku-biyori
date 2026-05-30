# BaseButton

汎用ボタンコンポーネント。`variant` で見た目を切り替え、`loading` / `disabled` 状態をサポートします。

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost'` | `'primary'` | 表示スタイル |
| `size` | `'sm' \| 'md'` | `'md'` | サイズ |
| `loading` | `boolean` | `false` | ローディングスピナーを表示し操作を無効化 |
| `disabled` | `boolean` | `false` | 操作を無効化 |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | ネイティブ button の type 属性 |

## Usage

```vue
<BaseButton variant="primary" @click="submit">保存</BaseButton>
<BaseButton variant="secondary" @click="cancel">キャンセル</BaseButton>
<BaseButton variant="ghost">詳細</BaseButton>
<BaseButton :loading="isSaving">保存中...</BaseButton>
<BaseButton type="submit" variant="primary">送信</BaseButton>
```

## Variants

| Variant | 用途 |
|---------|------|
| `primary` | 画面上の最重要アクション（1 画面に 1 つ） |
| `secondary` | サブアクション（outlined スタイル） |
| `ghost` | 補助的な操作（最も目立たない） |

## Design Notes

- 角丸は `--radius-sm`（4px）を使用
- シャドウなし（DESIGN.md の「ボタンを浮かせない」方針に準拠）
- `primary` のカラーは `--color-primary` のみ使用
