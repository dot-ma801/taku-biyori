# AvailabilityResponse

日程調整の ○△× 3 択回答 UI。プロダクトのシグネチャコンポーネント。

## Props

| 名前         | 型                                       | 既定    | 説明             |
| ------------ | ---------------------------------------- | ------- | ---------------- |
| `modelValue` | `'maru' \| 'sankaku' \| 'batsu' \| null` | `null`  | v-model          |
| `size`       | `number`                                 | `44`    | ボタンの縦横 px  |
| `disabled`   | `boolean`                                | `false` | 全ボタンを無効化 |

## Emits

- `update:modelValue`

## 単体テスト項目

- ○△× 3 ボタンが表示される
- modelValue と一致するボタンに `--active` が付く
- クリックで update:modelValue が発火する
- 選択中を再クリックで null が emit される（トグル）
- disabled のときは emit しない
- role=radiogroup / role=radio が付与される
