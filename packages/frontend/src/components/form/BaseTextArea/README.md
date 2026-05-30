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
