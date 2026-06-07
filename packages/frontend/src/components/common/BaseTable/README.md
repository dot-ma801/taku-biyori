# BaseTable

表形式のデータを表示する汎用テーブルコンポーネント。

## Props

| Prop        | Type            | Default | Description                        |
| ----------- | --------------- | ------- | ---------------------------------- |
| `columns`   | `TableColumn[]` | —       | カラム定義の配列                   |
| `rows`      | `T[]`           | —       | 表示するデータの配列               |
| `striped`   | `boolean`       | `false` | 交互に背景色を変えるストライプ表示 |
| `hoverable` | `boolean`       | `false` | 行ホバー時にハイライトを表示       |

### TableColumn

| フィールド | Type                            | Default  | Description                |
| ---------- | ------------------------------- | -------- | -------------------------- |
| `key`      | `string`                        | —        | データのキー名             |
| `label`    | `string`                        | —        | ヘッダーに表示するラベル   |
| `align`    | `'left' \| 'center' \| 'right'` | `'left'` | テキストの水平位置         |
| `sortable` | `boolean`                       | `false`  | クリックでソート可能にする |

## Slots

| Slot         | Props                        | Description                |
| ------------ | ---------------------------- | -------------------------- |
| `cell-{key}` | `{ row: T, value: unknown }` | 各セルの内容をカスタマイズ |
| `empty`      | —                            | データが空のときの表示内容 |

## Usage

```vue
<BaseTable :columns="columns" :rows="rows" striped hoverable>
  <template #cell-status="{ value }">
    <span :style="{ color: value === '参加中' ? 'var(--color-success)' : 'var(--color-text-muted)' }">
      {{ value }}
    </span>
  </template>
  <template #empty>
    該当するデータがありません
  </template>
</BaseTable>
```

```ts
const columns = [
  { key: 'name', label: '名前', sortable: true },
  { key: 'role', label: '役割' },
  { key: 'score', label: 'スコア', align: 'right', sortable: true },
];
```

## Design Notes

- CSS変数 `--color-*` を使用しダーク/ライト両モード対応
- テーブルはスクロール可能なラッパーで包まれており、横スクロールに対応
- ストライプは `surface-raised` カラーを使用

## 単体テスト項目

### レンダリング

- デフォルト props でテーブルがレンダリングされること
- カラムヘッダーが表示されること
- 行データが表示されること

### rows が空のとき

- 空メッセージが表示されること
- empty スロットで内容を上書きできること

### striped

- `striped=true` のとき偶数行に対応するクラスが付与されること
- `striped=false` のときストライプクラスが付与されないこと

### hoverable

- `hoverable=true` のとき対応するクラスが付与されること

### align

- `align=right` のカラムに対応するクラスが付与されること
- `align` 未指定のカラムに `left` クラスが付与されること

### カスタムセル

- `cell-{key}` スロットでセルの内容を上書きできること

### ソート

- `sortable=true` のカラムヘッダーに対応するクラスが付与されること
- `sortable=false` のカラムヘッダーにソートクラスが付与されないこと
- ソートヘッダーをクリックすると昇順に並び替えられること
- 同じヘッダーを2回クリックすると降順になること
- 同じヘッダーを3回クリックするとソートが解除されること
- ソート中のカラムに `aria-sort="ascending"` が付与されること
- 降順ソート中は `aria-sort="descending"` が付与されること

### アクセシビリティ

- ラッパーに `role="region"` が付与されていること
- `th` に `scope="col"` が付与されていること
