# UserAvatar

ユーザーのアバターを表示するコンポーネント。`vue-boring-avatars` で自動生成する。ボタン機能を持たない純粋な表示用コンポーネント。

## Props

| Prop      | Type                                                               | Default  | Description                                          |
| --------- | ------------------------------------------------------------------ | -------- | ---------------------------------------------------- |
| `size`    | `number`                                                           | `30`     | アバターのサイズ（px）                               |
| `variant` | `'marble' \| 'beam' \| 'pixel' \| 'sunset' \| 'ring' \| 'bauhaus'` | `'beam'` | アバターのデザインスタイル                           |
| `name`    | `string`                                                           | -        | 種（seed）として使う文字列。id を持たない相手向け    |
| `userId`  | `string`                                                           | -        | 種（seed）として使う不変な id。`name` より優先される |

## Usage

```vue
<!-- ログイン中ユーザー本人のアバター（id を明示せず authStore にフォールバック） -->
<UserAvatar :size="40" />

<!-- 特定ユーザーのアバターを明示的に指定（表示名が変わっても見た目を維持したい場合） -->
<UserAvatar :size="48" :user-id="profile.id" />

<!-- id を持たない相手（ゲスト等）は name で代用 -->
<UserAvatar :size="35" :name="member.baseName" />
```

## Design Notes

- アバター生成のシードは `props.userId ?? props.name ?? authStore.user?.id` の優先順位で決定する
- **表示名ではなく、可能な限り不変な id を種にする**（表示名が変わるたびに見た目が変わってしまうのを避けるため）。id を持たない相手（ゲスト参加者など）では `name` を使う
- `border-radius: var(--radius-full)` で円形表示
- 装飾的な要素として `aria-hidden="true"` を付与
- クリック可能にする場合は親要素でラップすること

## 単体テスト項目

### レンダリング

- デフォルト props でレンダリングされること
- size に応じた width/height スタイルが設定されること

### アクセシビリティ

- `aria-hidden="true"` が付与されていること

### アバターの種（seed）の優先順位

- `userId` prop が最優先で使われること
- `userId` が無いときは `name` prop が使われること
- props が無いときは `authStore.user.id` が使われること
- props も `authStore.user` も無いときは空文字にフォールバックすること
