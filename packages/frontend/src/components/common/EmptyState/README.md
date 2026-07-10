# EmptyState

データが無いときに表示する、暖かみのある空の状態。

## Props

| 名前          | 型           | 必須 | 説明                     |
| ------------- | ------------ | ---- | ------------------------ |
| `icon`        | `LucideIcon` | —    | `@lucide/vue` のアイコン |
| `title`       | `string`     | ✅   | 見出し                   |
| `description` | `string`     | —    | 補足文                   |

## Slots

- `default`: CTA ボタンなど

## 単体テスト項目

- タイトルが表示される
- description が表示される
- icon 指定時にアイコンサークルが表示される
- icon 未指定時は表示されない
- default スロットが actions として表示される
