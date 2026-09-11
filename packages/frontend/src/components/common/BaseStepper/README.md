# BaseStepper

複数ステップからなるフローの進捗を示す、非インタラクティブなステップインジケーター。

## Props

| Prop      | Type                | Default      | Description                                 |
| --------- | ------------------- | ------------ | ------------------------------------------- |
| `steps`   | `readonly string[]` | -            | 各ステップのラベル（1-origin の順序で表示） |
| `current` | `number`            | -            | 現在のステップ番号（1-origin）              |
| `label`   | `string`            | `'ステップ'` | ステップ全体を説明する aria-label           |

## Events

なし（非インタラクティブな表示専用コンポーネント）。

## Usage

```vue
<BaseStepper
  :steps="['候補日選択', '参加者選択', '確認']"
  :current="step"
  label="開催を追加する手順"
/>
```

## Design Notes

- ステップの状態（`completed` / `active` / `upcoming`）は `current` との比較から自動導出する
- `completed` は塗りつぶし円 + `@lucide/vue` の `Check` アイコン、`active` は塗りつぶし円 + 番号 + 太字ラベル、`upcoming` は枠線のみの円 + muted ラベル、と色以外の要素（形状・太さ）でも状態を区別する
- 接続線（`::before` 擬似要素）は `active` / `completed` のとき `--color-primary`、それ以外は `--color-border`
- クリックによるステップ間ジャンプは提供しない。フロー側の遷移ガード（バリデーション・確認ダイアログの割り込み等）をこのコンポーネントに持ち込まないため
- `<ol aria-label>` + 各 `<li>` で構成し、現在地は `aria-current="step"`、完了ステップには視覚的に隠れた「（完了）」を付与
- 非表示の `aria-live="polite"` 領域で `current` の変化をスクリーンリーダーに通知する（例:「ステップ2/3: 参加者選択」）
- ドメイン知識を持たないため `steps` はただのラベル配列。呼び出し側がラベル文言と `current` の状態管理（遷移ロジック）を持つ

## 単体テスト項目

### レンダリング

- `steps` の数だけステップ項目がレンダリングされること
- 各ステップのラベルが表示されること

### current

- `current` より前のステップに completed のクラスが付与されること
- `current` と一致するステップに active のクラスが付与されること
- `current` より後のステップに upcoming のクラスが付与されること
- completed のステップに完了を示す視覚的に隠れたテキストが付与されること

### アクセシビリティ

- active なステップに `aria-current="step"` が付与されること
- `label` prop がリストの `aria-label` に反映されること
- `label` を指定しないとき既定のラベルが付与されること
- `aria-live="polite"` 領域に現在地の文言が含まれること
