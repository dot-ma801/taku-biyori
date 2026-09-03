# BaseBreadcrumb

現在地までの階層を並べるパンくずリスト。

## Props

| Prop    | Type               | Default            | Description                            |
| ------- | ------------------ | ------------------ | -------------------------------------- |
| `items` | `BreadcrumbItem[]` | —                  | 上位から現在地までの項目。末尾が現在地 |
| `label` | `string`           | `'パンくずリスト'` | `nav` のアクセシブルネーム             |

### BreadcrumbItem

| Field   | Type                            | Description                                  |
| ------- | ------------------------------- | -------------------------------------------- |
| `label` | `string`                        | 表示するラベル                               |
| `to`    | `RouteLocationRaw \| undefined` | 遷移先。省略するとリンクにせず文字だけを出す |

## Events

なし。

## Usage

```vue
<BaseBreadcrumb
  :items="[
    { label: 'ダッシュボード', to: { name: 'dashboard' } },
    { label: lobbyTitle, to: { name: 'lobbies-detail', params: { lobbyId } } },
    { label: '開催の詳細' },
  ]"
/>
```

## Design Notes

- 末尾の項目は現在地なので、`to` を渡してもリンクにしない（`aria-current="page"` を付ける）
- 区切りは `@lucide/vue` の `ChevronRight`。装飾なので `aria-hidden="true"`
- CSS変数 `--color-*` を使用しダーク/ライト両モード対応
- 画面 URL を入れ子にした（design-v2 §7-1）ことで生まれた階層を、URL を触らなくても
  辿れるようにするための導線

## 単体テスト項目

### レンダリング

- 渡した項目をすべて表示すること
- 項目が1件だけでも表示できること

### items

- 末尾以外の項目はリンクになること
- 末尾の項目は `to` があってもリンクにしないこと
- `to` を持たない中間の項目はリンクにしないこと
- 末尾以外には区切りのアイコンが入ること

### アクセシビリティ

- `nav` に既定のアクセシブルネームが付くこと
- `label` を渡すとアクセシブルネームを差し替えられること
- 末尾の項目に `aria-current="page"` が付くこと
- 区切りのアイコンは `aria-hidden` にすること
