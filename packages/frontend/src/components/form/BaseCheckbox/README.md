# BaseCheckbox

チェックボックスコンポーネント。`@vuetify/v0` の `Checkbox` をベースに実装しています。

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `boolean` | `false` | v-model バインディング |
| `label` | `string` | — | チェックボックス横のラベルテキスト |
| `value` | `string` | — | グループ内使用時の値 |
| `disabled` | `boolean` | — | 操作を無効化 |

## Usage

```vue
<!-- 単独使用 -->
<BaseCheckbox v-model="agreed" label="利用規約に同意する" />

<!-- スロットでカスタムラベル -->
<BaseCheckbox v-model="agreed">
  <span><a href="/terms">利用規約</a>に同意する</span>
</BaseCheckbox>
```

## Design Notes

- チェック時は `--color-primary` の背景 + 白チェックアイコン（Lucide `Check`）
- 角丸は `--radius-sm`（4px）でラジオボタンと視覚的に区別
