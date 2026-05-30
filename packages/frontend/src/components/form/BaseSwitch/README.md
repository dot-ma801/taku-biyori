# BaseSwitch

トグルスイッチコンポーネント。ON/OFF の二値切り替えに使用します。

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `boolean` | `false` | v-model バインディング |
| `label` | `string` | — | スイッチ横のラベルテキスト |
| `disabled` | `boolean` | — | 操作を無効化 |

## Usage

```vue
<BaseSwitch v-model="notificationsEnabled" label="通知を有効にする" />
<BaseSwitch v-model="darkMode" label="ダークモード" />
```

## Design Notes

- OFF 時: `--color-border-strong` のトラック + 白サム
- ON 時: `--color-primary` のトラック + 白サム
- サムのスライドアニメーション: 0.2s
