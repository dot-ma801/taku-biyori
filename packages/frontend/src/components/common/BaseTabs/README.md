# BaseTabs

タブナビゲーションコンポーネント。`@vuetify/v0` の `Tabs` をベースに実装しています。

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `tabs` | `TabItem[]` | ✓ | タブ定義の配列 |
| `modelValue` | `string` | — | v-model バインディング（アクティブタブの `value`） |
| `label` | `string` | — | タブリストの aria-label |

## Types

```ts
interface TabItem {
  value: string
  label: string
  disabled?: boolean
}
```

## Slots

各タブのパネルは `tab.value` と同名の名前付きスロットで提供します。

## Usage

```vue
<BaseTabs
  v-model="activeTab"
  :tabs="[
    { value: 'overview', label: '概要' },
    { value: 'details', label: '詳細' },
    { value: 'settings', label: '設定', disabled: true },
  ]"
>
  <template #overview>概要コンテンツ</template>
  <template #details>詳細コンテンツ</template>
</BaseTabs>
```

## Design Notes

- アクティブタブは `--color-primary` のアンダーライン + テキスト色
- `disabled` タブは opacity 40% で操作不可
- キーボードナビゲーション対応（`@vuetify/v0` Tabs の機能）
