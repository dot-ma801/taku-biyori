# BaseSwitch

トグルスイッチコンポーネント。ON/OFF の二値切り替えに使用します。

## Props

| Prop         | Type      | Default | Description                |
| ------------ | --------- | ------- | -------------------------- |
| `modelValue` | `boolean` | `false` | v-model バインディング     |
| `label`      | `string`  | —       | スイッチ横のラベルテキスト |
| `disabled`   | `boolean` | —       | 操作を無効化               |

## Usage

```vue
<BaseSwitch v-model="notificationsEnabled" label="通知を有効にする" />
<BaseSwitch v-model="darkMode" label="ダークモード" />
```

## Design Notes

- OFF 時: `--color-border-strong` のトラック + 白サム
- ON 時: `--color-primary` のトラック + 白サム
- サムのスライドアニメーション: 0.2s

## 単体テスト項目

### レンダリング

- デフォルト props でレンダリングされること（`modelValue=false`）

### label

- `label` prop を渡したとき、ラベルテキストが表示されること

### modelValue

- `modelValue=false` のとき OFF 状態のスタイルクラスが付与されること
- `modelValue=true` のとき ON 状態のスタイルクラスが付与されること
- スイッチをクリックしたとき `update:modelValue` イベントが発火し、値が反転すること

### disabled

- `disabled=true` のとき操作不能クラスまたは属性が付与されること
- `disabled=true` のときクリックしても `update:modelValue` イベントが発火しないこと

### アクセシビリティ

- `role="switch"` が付与されていること
- `aria-checked` が `modelValue` の値（`"true"` / `"false"`）に対応して付与されること
- `label` prop がアクセシブルなラベルとして関連付けられていること
- `disabled=true` のとき `aria-disabled="true"` が付与されること
