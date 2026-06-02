# BaseTabs

タブナビゲーションコンポーネント。`@vuetify/v0` の `Tabs` をベースに実装しています。

## Props

| Prop          | Type        | Required | Description                                                                          |
| ------------- | ----------- | -------- | ------------------------------------------------------------------------------------ |
| `tabs`        | `TabItem[]` | ✓        | タブ定義の配列                                                                       |
| `modelValue`  | `string`    | —        | v-model バインディング（アクティブタブの `value`）                                   |
| `label`       | `string`    | —        | タブリストの aria-label                                                              |
| `stretch`     | `boolean`   | —        | タブボタンを均等幅・中央揃えにする                                                   |
| `fixedHeight` | `boolean`   | —        | パネルエリアの高さを最も高いパネルに固定し、タブ切り替えでレイアウトがずれるのを防ぐ |

## Types

```ts
interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
}
```

## Slots

各タブのパネルは `tab.value` と同名の名前付きスロットで提供します。

## Usage

```vue
<!-- 基本 -->
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

<!-- タブを均等幅にして高さを固定（ログイン/新規作成フォームなど） -->
<BaseTabs :tabs="tabs" stretch fixed-height>
  <template #signin><LoginCard /></template>
  <template #signup><SignupCard /></template>
</BaseTabs>
```

## Design Notes

- アクティブタブは `--color-primary` のアンダーライン + テキスト色
- `disabled` タブは opacity 40% で操作不可
- キーボードナビゲーション対応（`@vuetify/v0` Tabs の機能）

## 単体テスト項目

### レンダリング

- `tabs` prop に渡した数だけタブボタンが表示されること
- 各タブの `label` がボタンテキストとして表示されること

### modelValue

- `modelValue` で指定したタブが初期アクティブ状態になること
- タブをクリックしたとき `update:modelValue` イベントが発火し、クリックしたタブの `value` が渡されること

### disabled

- `disabled=true` のタブが操作不能（`aria-disabled` または `disabled` 属性）になること
- 無効タブをクリックしても `update:modelValue` イベントが発火しないこと

### slots

- アクティブタブに対応する名前付きスロットのコンテンツが表示されること
- 非アクティブタブのスロットコンテンツが非表示になること

### label

- `label` prop が `aria-label` としてタブリストに付与されること

### stretch

- `stretch=true` のとき `.tabs__list--stretch` クラスが付与されること
- `stretch` 未指定のとき `.tabs__list--stretch` クラスが付与されないこと

### fixedHeight

- `fixedHeight=true` のとき `.tabs__panels--fixed-height` クラスが付与されること
- `fixedHeight` 未指定のとき `.tabs__panels--fixed-height` クラスが付与されないこと

### アクセシビリティ

- タブリストに `role="tablist"` が付与されていること
- 各タブボタンに `role="tab"` が付与されていること
- アクティブタブに `aria-selected="true"` が付与されること
- 非アクティブタブに `aria-selected="false"` が付与されること
- 無効タブに `aria-disabled="true"` が付与されること
- 各タブパネルに `role="tabpanel"` が付与されていること
- タブパネルに `aria-labelledby` で対応するタブの id が指定されていること
- キーボード（←→キー）でタブ間を移動できること
