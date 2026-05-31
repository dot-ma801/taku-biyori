# BasePopover

アクティベーター要素をクリックすると表示されるポップオーバーオーバーレイコンポーネント。

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placement` | `'bottom' \| 'bottom-start' \| 'bottom-end' \| 'top' \| 'top-start' \| 'top-end'` | `'bottom-end'` | ポップオーバーの表示位置 |

## Slots

| Slot | Description |
|------|-------------|
| `activator` | ポップオーバーを開くトリガー要素 |
| `default` | ポップオーバー内に表示するコンテンツ |

## Usage

```vue
<BasePopover placement="bottom-end">
  <template #activator>
    <CircleUser :size="32" aria-label="アカウントメニューを開く" />
  </template>
  <ul>
    <li>ログイン / サインイン</li>
  </ul>
</BasePopover>
```

## Design Notes

- CSS変数 `--color-*` を使用しダーク/ライト両モード対応
- アイコンは `@lucide/vue` を使用（`CircleUser` など）
- `@vuetify/v0` の `Popover` コンポーネントをロジック層として活用
- ポップオーバーパネルは `border` + 薄い `box-shadow` で浮き感を表現

## 単体テスト項目

### レンダリング
- デフォルト props でレンダリングされること
- activator スロットの内容がレンダリングされること

### placement
- すべての placement 値（bottom / bottom-start / bottom-end / top / top-start / top-end）が受け入れられること
- デフォルトの placement が `bottom-end` であること

### アクセシビリティ
- activator にキーボードフォーカス可能な要素を渡せること
