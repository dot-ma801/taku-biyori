# PageContainer

ページコンテンツを中央寄せし、最大幅と左右余白を与えるレイアウトコンテナ。

## Props

| Prop   | Type           | Default | Description                           |
| ------ | -------------- | ------- | ------------------------------------- |
| `size` | `'md' \| 'lg'` | `'md'`  | 最大幅。`md` は 960px、`lg` は 1200px |

## Events

なし。

## Usage

```vue
<PageContainer>
  <GameSessionList />
</PageContainer>
```

一覧やテーブルなど幅を使う画面では `size="lg"` を指定する。

```vue
<PageContainer size="lg">
  <WideContent />
</PageContainer>
```

## Design Notes

- `max-width` + `margin-inline: auto` による中央寄せ。画面が最大幅を超えると左右余白が自動で生まれる
- 狭い画面向けの最低限の余白として `padding-inline: var(--space-4)` を持つ
- 色・装飾は持たない純粋なレイアウトコンポーネント（ドメイン知識なし）

## 単体テスト項目

### レンダリング

- デフォルト props でレンダリングされること
- slot のコンテンツが表示されること

### size

- デフォルトで `.page-container--md` クラスが付与されること
- `size="md"` のとき対応するクラスが付与されること
- `size="lg"` のとき対応するクラスが付与されること
