# BaseLoadingOverlay

画面全体を覆うグローバルなローディングスピナー。`App.vue` に 1 度だけ配置します。

表示制御は `useLoading` コンポーザブルで行います（props はありません）。

## Usage

### App.vue に配置

```vue
<!-- App.vue -->
<template>
  <div class="app-container">
    <router-view />
    <BaseLoadingOverlay />
  </div>
</template>
```

### 任意のコンポーネントから呼び出し

```ts
import { useLoading } from '@/composables/useLoading';

const { start, reset, withLoading, isLoading } = useLoading();

// 非同期処理を囲む（例外時も自動で解除される）
await withLoading(() => api.save(), '保存しています…');

// リダイレクトを伴う処理など、明示的に制御したい場合
const stopLoading = start('Google に接続しています…');
// …リダイレクトされずに失敗したときだけ解除する
stopLoading();
```

## useLoading API

| Method        | Signature                                        | Description                                        |
| ------------- | ------------------------------------------------ | -------------------------------------------------- |
| `isLoading`   | `ComputedRef<boolean>`                           | ローディング中かどうか                             |
| `message`     | `ComputedRef<string \| null>`                    | 表示中のメッセージ（未指定なら `null`）            |
| `start`       | `(message?: string) => () => void`               | ローディング開始。**その処理専用の解除関数**を返す |
| `reset`       | `() => void`                                     | カウントに関係なく強制終了（bfcache 復帰時など）   |
| `withLoading` | `(fn: () => Promise<T>, message?) => Promise<T>` | 非同期処理を囲む。`finally` で必ず解除される       |

`start()` が返す解除関数は次の性質を持つ。

- 多重呼び出しはカウントアップされ、すべて解除されるまで表示が続く
- 同じ解除関数を複数回呼んでも、2 回目以降は無視される（他の処理のカウントを減らさない）
- `reset()` をまたいだ解除は無視される（リセット後に始まった表示を消さない）

## Design Notes

- `Teleport to="body"` で body 末尾にマウント（`position: fixed; inset: 0`）
- `z-index: 9998`。トースト（9999）より下、ヘッダー/フッター（100）より上に重なる
- 背景は `color-mix()` で `--color-background` を半透明にしており、ダーク/ライト両モード対応
- スピナーは `@lucide/vue` の `LoaderCircle` を CSS アニメーションで回転させる
- `prefers-reduced-motion: reduce` のときは回転を遅くし、フェードを無効化する
- メッセージ未指定時のフォールバック文言（`読み込み中…`）はコンポーネント側の `computed` で解決する
- `@vuetify/v0` に対応する headless コンポーネントはないため、ロジックは `useLoading` に自前で持たせている

## 単体テスト項目

### レンダリング

- ローディング中でないときオーバーレイが表示されないこと
- ローディング中のときオーバーレイが表示されること
- スピナーが表示されること

### useLoading 連携

- `start(message)` で渡したメッセージが表示されること
- メッセージなしで `start()` したとき既定の文言（`読み込み中…`）が表示されること
- `start()` が返す解除関数の呼び出しでオーバーレイが非表示になること
- 多重に `start()` したとき、すべて解除するまで表示され続けること

### アクセシビリティ

- `role="status"` が付与されていること
- `aria-live="polite"` と `aria-busy="true"` が付与されていること
- 装飾用のスピナーが `aria-hidden="true"` になっていること
