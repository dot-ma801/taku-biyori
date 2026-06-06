# BaseSectionHeading

アイコン付きセクション見出しコンポーネント。見出しレベルに応じてアイコンサイズが自動決定される。

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `level` | `'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6'` | `'h2'` | 出力する見出し要素のレベル |
| `icon` | `Component` | — | Lucide アイコンコンポーネント。省略するとアイコンなしで表示 |
| `iconColor` | `'primary' \| 'default' \| string` | `'primary'` | アイコンの色。`'primary'` は `--color-primary`、`'default'` は `currentColor`、任意の CSS カラー値も指定可能 |

## アイコンサイズの自動決定

`level` に応じてアイコンサイズが自動設定されるため、呼び出し側での指定は不要。

| level | アイコンサイズ |
|-------|-------------|
| h1 | 28px |
| h2 | 24px |
| h3 | 20px |
| h4 | 18px |
| h5 | 15px |
| h6 | 13px |

## Slots

| Slot | Description |
|------|-------------|
| `default` | 見出しテキスト |

## Usage

```vue
<BaseSectionHeading level="h2" :icon="NotebookPen">
  基本情報
</BaseSectionHeading>

<BaseSectionHeading level="h5" :icon="BookOpenText">
  シナリオ情報
</BaseSectionHeading>

<!-- アイコンカラーを変更 -->
<BaseSectionHeading level="h3" :icon="Settings" iconColor="default">
  設定
</BaseSectionHeading>

<!-- アイコンなし -->
<BaseSectionHeading level="h2">
  見出しテキスト
</BaseSectionHeading>
```

## Design Notes

- `icon` prop には `@lucide/vue` のコンポーネントを渡す
- アイコンラッパーに `aria-hidden="true"` を付与し、スクリーンリーダーの重複読み上げを防ぐ
- `iconColor` に `(string & {})` 型を使い、`'primary'` / `'default'` の補完を保ちつつ任意値も受け付ける

## 単体テスト項目

### レンダリング
- デフォルト props でレンダリングされること
- デフォルトで h2 要素としてレンダリングされること
- default スロットのテキストが表示されること

### level
- `level="h1"` のとき h1 要素としてレンダリングされること
- `level="h2"` のとき h2 要素としてレンダリングされること
- `level="h3"` のとき h3 要素としてレンダリングされること
- `level="h4"` のとき h4 要素としてレンダリングされること
- `level="h5"` のとき h5 要素としてレンダリングされること
- `level="h6"` のとき h6 要素としてレンダリングされること

### icon
- icon prop を渡したとき `.section-heading__icon` が表示されること
- icon prop を渡したとき `aria-hidden="true"` が付与されること
- icon prop がないとき `.section-heading__icon` が表示されないこと

### iconColor
- `iconColor="primary"` のとき `var(--color-primary)` が適用されること
- `iconColor="default"` のとき `currentColor` が適用されること
- 任意の色文字列を渡したとき style に反映されること
