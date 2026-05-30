# BaseToastContainer

トースト通知のコンテナコンポーネント。`App.vue` に 1 度だけ配置します。

表示制御は `useToast` コンポーザブルで行います。

## Usage

### App.vue に配置

```vue
<!-- App.vue -->
<template>
  <div class="app-container">
    <router-view />
    <BaseToastContainer />
  </div>
</template>
```

### 任意のコンポーネントから呼び出し

```ts
import { useToast } from '@/composables/useToast'

const toast = useToast()

toast.success('保存しました')
toast.error('エラーが発生しました')
toast.warning('注意が必要です')
toast.info('情報メッセージ')

// duration 指定（ミリ秒）
toast.success('完了', 6000)
```

## useToast API

| Method | Signature | Description |
|--------|-----------|-------------|
| `show` | `(message, variant?, duration?) => void` | 汎用表示 |
| `success` | `(message, duration?) => void` | 成功トースト |
| `error` | `(message, duration?) => void` | エラートースト |
| `warning` | `(message, duration?) => void` | 警告トースト |
| `info` | `(message, duration?) => void` | 情報トースト |
| `dismiss` | `(id: number) => void` | 指定 ID を手動で消去 |

## Design Notes

- `Teleport to="body"` で body 末尾にマウント（`position: fixed; bottom; right`）
- 複数トーストを縦に積み上げ（stack）
- 入場: 下からスライドイン / 退場: 右にスライドアウト（`TransitionGroup`）
- デフォルト表示時間: 4 秒
- 背景・アイコン色はダーク/ライト両モード対応（`color-mix()` ベース）
