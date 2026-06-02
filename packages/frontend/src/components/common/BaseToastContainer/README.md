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
import { useToast } from '@/composables/useToast';

const toast = useToast();

toast.success('保存しました');
toast.error('エラーが発生しました');
toast.warning('注意が必要です');
toast.info('情報メッセージ');

// duration 指定（ミリ秒）
toast.success('完了', 6000);
```

## useToast API

| Method    | Signature                                | Description          |
| --------- | ---------------------------------------- | -------------------- |
| `show`    | `(message, variant?, duration?) => void` | 汎用表示             |
| `success` | `(message, duration?) => void`           | 成功トースト         |
| `error`   | `(message, duration?) => void`           | エラートースト       |
| `warning` | `(message, duration?) => void`           | 警告トースト         |
| `info`    | `(message, duration?) => void`           | 情報トースト         |
| `dismiss` | `(id: number) => void`                   | 指定 ID を手動で消去 |

## Design Notes

- `Teleport to="body"` で body 末尾にマウント（`position: fixed; bottom; right`）
- 複数トーストを縦に積み上げ（stack）
- 入場: 下からスライドイン / 退場: 右にスライドアウト（`TransitionGroup`）
- デフォルト表示時間: 4 秒
- 背景・アイコン色はダーク/ライト両モード対応（`color-mix()` ベース）

## 単体テスト項目

### useToast 連携

- `toast.success(message)` を呼んだとき、成功バリアントのトーストが表示されること
- `toast.error(message)` を呼んだとき、エラーバリアントのトーストが表示されること
- `toast.warning(message)` を呼んだとき、警告バリアントのトーストが表示されること
- `toast.info(message)` を呼んだとき、情報バリアントのトーストが表示されること
- `toast.show(message)` を呼んだとき、トーストが表示されること

### 複数トースト

- 複数回 `toast.show()` を呼んだとき、呼んだ数だけトーストが積み上がって表示されること

### 自動消去

- デフォルト duration（4000ms）経過後にトーストが非表示になること
- `duration` を指定したとき、その時間経過後にトーストが非表示になること

### 手動消去

- `toast.dismiss(id)` を呼んだとき、対象トーストが非表示になること

### マウント位置

- コンポーネントが `body` 直下にテレポートされること

### アクセシビリティ

- トーストコンテナに `aria-live="polite"`（または `"assertive"`）が付与されていること
- エラートーストのとき `aria-live="assertive"` / `role="alert"` が付与されること
- トーストにメッセージテキストが含まれ、スクリーンリーダーに読み上げられること
