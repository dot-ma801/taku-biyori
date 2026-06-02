# BasePopover

アクティベーター要素をクリックすると表示されるポップオーバーオーバーレイコンポーネント。

## Props

| Prop        | Type                                                                              | Default        | Description              |
| ----------- | --------------------------------------------------------------------------------- | -------------- | ------------------------ |
| `placement` | `'bottom' \| 'bottom-start' \| 'bottom-end' \| 'top' \| 'top-start' \| 'top-end'` | `'bottom-end'` | ポップオーバーの表示位置 |

## Slots

| Slot        | Description                          |
| ----------- | ------------------------------------ |
| `activator` | ポップオーバーを開くトリガー要素     |
| `default`   | ポップオーバー内に表示するコンテンツ |

## Usage

```vue
<BasePopover placement="bottom-end">
  <template #activator>
    <button>メニューを開く</button>
  </template>
  <ul>
    <li>項目 A</li>
    <li>項目 B</li>
  </ul>
</BasePopover>
```

## Design Notes

- CSS変数 `--color-*` を使用しダーク/ライト両モード対応
- `@vuetify/v0` の `Popover` コンポーネントをロジック層として活用
- ポップオーバーパネルは `border` + 薄い `box-shadow` で浮き感を表現

## 単体テスト項目

### レンダリング

- デフォルト props でレンダリングされること
- activator スロットの内容がレンダリングされること

### placement

- 各 placement 値が対応する CSS `positionArea` 値（`'bottom right'` など）に変換されて PopoverContent に渡されること
- デフォルトの placement `bottom-end` が `"bottom right"` として渡されること

### アクセシビリティ

- activator にキーボードフォーカス可能な要素を渡せること
