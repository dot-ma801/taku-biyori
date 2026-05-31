# BaseTextBox

テキスト入力フィールド。ラベル・ヒント・バリデーションルールをサポートします。

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string` | `''` | v-model バインディング |
| `label` | `string` | — | フィールドラベル |
| `placeholder` | `string` | — | プレースホルダーテキスト |
| `hint` | `string` | — | フィールド下部のヒントテキスト |
| `type` | `string` | `'text'` | input の type 属性 |
| `rules` | `((v: string) => true \| string)[]` | — | バリデーションルール配列 |
| `disabled` | `boolean` | — | 入力を無効化 |
| `readonly` | `boolean` | — | 読み取り専用 |

## Usage

```vue
<BaseTextBox
  v-model="email"
  label="メールアドレス"
  placeholder="example@email.com"
  hint="ログインに使用します"
  :rules="[(v) => !!v || '必須項目です', (v) => /.+@.+/.test(v) || '形式が正しくありません']"
/>
```

## Design Notes

- バリデーションは `blur` 時に実行（`@vuetify/v0` `Input` コンポーネントの `validate-on="blur"`）
- エラー時は下部にエラーメッセージ、ヒントは非表示
- フォーカス時に `--color-primary` のフォーカスリングを表示

## 単体テスト項目

### レンダリング
- デフォルト props でレンダリングされること（`type="text"`）

### label / placeholder / hint
- `label` prop を渡したとき、ラベルテキストが表示されること
- `placeholder` prop を渡したとき、プレースホルダーが表示されること
- `hint` prop を渡したとき、ヒントテキストが表示されること

### modelValue
- `modelValue` の値が input に表示されること
- 入力すると `update:modelValue` イベントが発火すること

### type
- `type="password"` のとき input の `type` 属性が `"password"` になること
- `type="email"` のとき input の `type` 属性が `"email"` になること

### バリデーション
- blur 時に `rules` が評価され、エラーの場合はエラーメッセージが表示されること
- エラー表示中はヒントテキストが非表示になること
- バリデーションを通過したとき、エラーメッセージが表示されないこと

### disabled / readonly
- `disabled=true` のとき入力不能になること
- `readonly=true` のとき読み取り専用になること

### アクセシビリティ
- `label` prop と `<input>` が `for`/`id` で紐付いていること
- バリデーションエラー時に `aria-invalid="true"` が付与されること
- ヒントまたはエラーメッセージが `aria-describedby` で `<input>` に関連付けられていること
- `disabled=true` のとき `aria-disabled="true"` または `disabled` 属性が付与されること
