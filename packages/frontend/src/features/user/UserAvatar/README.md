# UserAvatar

ログイン中ユーザーのアバターを表示するコンポーネント。`authStore` からユーザー名を取得し、`vue-boring-avatars` で自動生成する。ボタン機能を持たない純粋な表示用コンポーネント。

## Props

| Prop      | Type                                                               | Default  | Description                |
| --------- | ------------------------------------------------------------------ | -------- | -------------------------- |
| `size`    | `number`                                                           | `30`     | アバターのサイズ（px）     |
| `variant` | `'marble' \| 'beam' \| 'pixel' \| 'sunset' \| 'ring' \| 'bauhaus'` | `'beam'` | アバターのデザインスタイル |

## Usage

```vue
<UserAvatar :size="40" />
```

## Design Notes

- `authStore.user?.name` をアバター生成のシードとして使用
- `border-radius: var(--radius-full)` で円形表示
- 装飾的な要素として `aria-hidden="true"` を付与
- クリック可能にする場合は親要素でラップすること

## 単体テスト項目

### レンダリング

- デフォルト props でレンダリングされること
- size に応じた width/height スタイルが設定されること

### アクセシビリティ

- `aria-hidden="true"` が付与されていること
