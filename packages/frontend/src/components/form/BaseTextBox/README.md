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
