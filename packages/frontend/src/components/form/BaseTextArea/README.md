# BaseTextArea

複数行テキスト入力フィールド。リサイズ方向・バリデーションをサポートします。

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string` | `''` | v-model バインディング |
| `label` | `string` | — | フィールドラベル |
| `placeholder` | `string` | — | プレースホルダーテキスト |
| `hint` | `string` | — | ヒントテキスト（エラーなし時のみ表示） |
| `rows` | `number` | `4` | 初期表示行数 |
| `rules` | `((v: string) => true \| string)[]` | — | バリデーションルール配列 |
| `disabled` | `boolean` | — | 入力を無効化 |
| `readonly` | `boolean` | — | 読み取り専用 |
| `resize` | `'none' \| 'vertical' \| 'horizontal' \| 'both'` | `'vertical'` | リサイズ方向 |

## Usage

```vue
<BaseTextArea
  v-model="content"
  label="本文"
  placeholder="内容を入力..."
  hint="最大 1000 文字"
  :rows="6"
  :rules="[(v) => v.length <= 1000 || '1000文字以内で入力してください']"
/>
```

## 単体テスト項目

### レンダリング
- デフォルト props でレンダリングされること（`rows=4`, `resize="vertical"`）

### label / placeholder / hint
- `label` prop を渡したとき、ラベルテキストが表示されること
- `placeholder` prop を渡したとき、プレースホルダーが表示されること
- `hint` prop を渡したとき、ヒントテキストが表示されること

### modelValue
- `modelValue` の値がテキストエリアに表示されること
- 入力すると `update:modelValue` イベントが発火すること

### rows
- `rows` prop がテキストエリアの `rows` 属性に反映されること

### resize
- `resize` prop の値が対応するスタイルとして適用されること（`none` / `vertical` / `horizontal` / `both`）

### バリデーション
- blur 時に `rules` が評価され、エラーの場合はエラーメッセージが表示されること
- エラー表示中はヒントテキストが非表示になること
- 再入力でエラーが解消されたとき、エラーメッセージが消えること

### disabled / readonly
- `disabled=true` のとき入力不能になること
- `readonly=true` のとき読み取り専用になること

### アクセシビリティ
- `label` prop と `<textarea>` が `for`/`id` で紐付いていること
- バリデーションエラー時に `aria-invalid="true"` が付与されること
- ヒントまたはエラーメッセージが `aria-describedby` で `<textarea>` に関連付けられていること
- `disabled=true` のとき `aria-disabled="true"` または `disabled` 属性が付与されること
