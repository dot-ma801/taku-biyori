# BaseCollapsible

アコーディオン形式の折りたたみコンポーネント。`@vuetify/v0` の `Collapsible` をベースに実装しています。

## Props

| Prop          | Type      | Required | Description                        |
| ------------- | --------- | -------- | ---------------------------------- |
| `title`       | `string`  | ✓        | アクティベーターに表示するタイトル |
| `defaultOpen` | `boolean` | —        | 初期状態で開いた状態にする         |

## Model

| Model     | Type      | Description                    |
| --------- | --------- | ------------------------------ |
| `v-model` | `boolean` | 開閉状態の双方向バインディング |

## Usage

```vue
<!-- 単純なアコーディオン -->
<BaseCollapsible title="よくある質問">
  回答テキストがここに入ります。
</BaseCollapsible>

<!-- デフォルトで開いた状態 -->
<BaseCollapsible title="詳細設定" :default-open="true">
  設定内容...
</BaseCollapsible>
```

## Design Notes

- `<ChevronDown>` アイコンが開閉に合わせて 180 度回転（0.2s transition）
- アクティベーターは `surface-raised` 背景、コンテンツは `surface` 背景
- ボーダーとシャドウで囲まれた独立した UI ブロック

## 単体テスト項目

### レンダリング

- `title` prop が表示されること
- デフォルトで閉じた状態でレンダリングされること（`defaultOpen` 未指定）

### defaultOpen

- `defaultOpen=true` のとき初期状態でコンテンツが表示されること
- `defaultOpen=false`（省略）のとき初期状態でコンテンツが非表示であること

> ⚠️ **テスト除外（`defaultOpen` / `modelValue` による初期開状態）**
> `@vuetify/v0` の `Collapsible.Root` はアンコントロールドコンポーネントのため、
> 外部から `open` prop を渡しても内部状態を書き換えない。
> また `defaultOpen` は jsdom で CSS を評価できないため `isVisible()` が機能しない。
> **現在の単体テストでは「クリック操作後の状態」で代替している。**
> ブラウザ上の E2E テストで補完すること。

### 開閉操作

- アクティベーター（タイトルボタン）をクリックするとコンテンツが表示されること
- 展開済みの状態でクリックするとコンテンツが非表示になること
- 開閉切り替えに応じて ChevronDown アイコンが回転クラスを切り替えること

### v-model

- 外部から `modelValue=true` を渡したときコンテンツが表示されること
- 開閉操作時に `update:modelValue` イベントが発火すること

### アクセシビリティ

- アクティベーターボタンに `aria-expanded` が開閉状態（`"true"` / `"false"`）で付与されること
- アクティベーターボタンに `aria-controls` でコンテンツ領域の id が指定されていること
