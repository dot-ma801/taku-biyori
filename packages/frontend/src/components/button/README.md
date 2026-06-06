# BaseButton

汎用ボタンコンポーネント。`variant` で見た目を切り替え、`loading` / `disabled` 状態をサポートします。

## Props

| Prop       | Type                                  | Default     | Description                              |
| ---------- | ------------------------------------- | ----------- | ---------------------------------------- |
| `variant`  | `'primary' \| 'secondary' \| 'ghost'` | `'primary'` | 表示スタイル                             |
| `size`     | `'sm' \| 'md' \| 'lg'`                | `'md'`      | サイズ                                   |
| `loading`  | `boolean`                             | `false`     | ローディングスピナーを表示し操作を無効化 |
| `disabled` | `boolean`                             | `false`     | 操作を無効化                             |
| `type`     | `'button' \| 'submit' \| 'reset'`     | `'button'`  | ネイティブ button の type 属性           |

## Usage

```vue
<BaseButton variant="primary" @click="submit">保存</BaseButton>
<BaseButton variant="secondary" @click="cancel">キャンセル</BaseButton>
<BaseButton variant="ghost">詳細</BaseButton>
<BaseButton :loading="isSaving">保存中...</BaseButton>
<BaseButton type="submit" variant="primary">送信</BaseButton>
```

## Variants

| Variant     | 用途                                      |
| ----------- | ----------------------------------------- |
| `primary`   | 画面上の最重要アクション（1 画面に 1 つ） |
| `secondary` | サブアクション（outlined スタイル）       |
| `ghost`     | 補助的な操作（最も目立たない）            |

## Design Notes

- 角丸は `--radius-sm`（4px）を使用
- シャドウなし（DESIGN.md の「ボタンを浮かせない」方針に準拠）
- `primary` のカラーは `--color-primary` のみ使用

## 単体テスト項目

### レンダリング

- デフォルト props でレンダリングされること（`variant="primary"`, `size="md"`）
- スロットのテキストが表示されること

### variant

- `variant="primary"` のとき `.btn--primary` クラスが付与されること
- `variant="secondary"` のとき `.btn--secondary` クラスが付与されること
- `variant="ghost"` のとき `.btn--ghost` クラスが付与されること

### size

- `size="sm"` のとき `.btn--sm` クラスが付与されること
- `size="md"` のとき `.btn--md` クラスが付与されること
- `size="lg"` のとき `.btn--lg` クラスが付与されること

### disabled

- `disabled=true` のとき `disabled` 属性が付与されること
- `disabled=true` のときクリックしても `click` イベントが発火しないこと

### loading

- `loading=true` のときスピナー要素が表示されること
- `loading=true` のとき `disabled` 属性が付与されること
- `loading=false` のときスピナー要素が表示されないこと

### type

- `type="submit"` のとき button の `type` 属性が `"submit"` になること
- `type="reset"` のとき button の `type` 属性が `"reset"` になること

### イベント

- クリック時に `click` イベントが発火すること

### アクセシビリティ

- `disabled=true` のとき `aria-disabled="true"` が付与されること
- `loading=true` のとき `aria-busy="true"` が付与されること
- スロットのテキストがボタンのアクセシブルな名前として機能すること
