# BaseCard

コンテンツをグループ化するカードコンポーネント。ヘッダー・ボディ・アクション領域をスロットで提供します。

## Props

| Prop        | Type      | Default | Description                  |
| ----------- | --------- | ------- | ---------------------------- |
| `title`     | `string`  | —       | カードタイトル               |
| `subtitle`  | `string`  | —       | タイトル下のサブテキスト     |
| `noPadding` | `boolean` | `false` | ボディのパディングを除去     |
| `hoverable` | `boolean` | `false` | ホバー時に影とボーダーを強調 |

## Slots

| Slot      | Description                                                |
| --------- | ---------------------------------------------------------- |
| `header`  | ヘッダー領域（指定時は `title`/`subtitle` props を上書き） |
| `default` | カード本文                                                 |
| `actions` | 右下のアクション領域（薄い背景色付き）                     |

## Usage

```vue
<BaseCard title="ユーザー情報" subtitle="プロフィール設定">
  <p>コンテンツがここに入ります。</p>

  <template #actions>
    <BaseButton variant="ghost" size="sm">キャンセル</BaseButton>
    <BaseButton variant="primary" size="sm">保存</BaseButton>
  </template>
</BaseCard>
```

## Design Notes

- `surface` 背景 + `--shadow-sm` の控えめなシャドウ
- ヘッダーとアクション領域はボーダーで本文と分離
- `hoverable` 時は `transition: box-shadow 0.15s`

## 単体テスト項目

### レンダリング

- デフォルト props でレンダリングされること

### title / subtitle

- `title` prop を渡したとき、タイトルが表示されること
- `subtitle` prop を渡したとき、サブテキストが表示されること
- `title` がない場合、ヘッダー領域が表示されないこと

### slots

- `default` スロットのコンテンツが表示されること
- `header` スロットを渡したとき、`title`/`subtitle` props より優先して表示されること
- `actions` スロットを渡したとき、アクション領域に表示されること
- `actions` スロットがない場合、アクション領域が表示されないこと

### noPadding

- `noPadding=false` のとき本文にパディングが付与されること
- `noPadding=true` のとき本文のパディングが除去されること

### hoverable

- `hoverable=false` のときホバークラスが付与されないこと
- `hoverable=true` のときホバークラスが付与されること

### アクセシビリティ

- `title` prop が見出し要素（`<h2>` 等）としてレンダリングされること
- `subtitle` がタイトルに関連付けられた補足テキストとして配置されること
