# LobbyStatusBadge

`LobbyStatus` を受け取り、ステータスに対応したラベルと色のバッジを表示するコンポーネント。

ドメイン知識（`LobbyStatus` の enum）を持つが、複数の feature から共通で利用されるため `components/common/` に配置している。  
API 呼び出しは行わず、表示のみを担当する。ラベルとバリアントの導出は `useLobbyStatusBadge` に置き、
コンポーネント側はその結果をテンプレートに流すだけにしている（データの導出をコンポーネントに書かない、という規約に従う）。

## Props

| Prop     | Type          | Description                |
| -------- | ------------- | -------------------------- |
| `status` | `LobbyStatus` | 表示するロビーのステータス |

## Usage

```vue
<LobbyStatusBadge :status="lobby.status" />
```

## ステータスとバリアントの対応

ラベルは design-v2 §4-1 の「日本語」列に揃えている。

| ステータス  | ラベル   | バリアント          |
| ----------- | -------- | ------------------- |
| `draft`     | 下書き   | muted（グレー）     |
| `open`      | 受付中   | primary（ティール） |
| `closed`    | 受付終了 | warning（オレンジ） |
| `disbanded` | 解散     | error（レッド）     |

## Design Notes

- CSS変数 `--color-*` を使用し、ライト/ダーク両テーマに対応
- `color-mix()` でソフトな背景色を生成（15% の割合）
- `--radius-full` による pill 形状
- `Base` プレフィックスなし：ドメイン知識（`LobbyStatus` enum）を持つため汎用 UI プリミティブではない

## 単体テスト項目

### レンダリング

- `status` props を渡してレンダリングされること

### ラベル

- `draft` のとき「下書き」と表示されること
- `open` のとき「受付中」と表示されること
- `closed` のとき「受付終了」と表示されること
- `disbanded` のとき「解散」と表示されること

### バリアント

- `draft` のとき `status-badge--muted` クラスが付与されること
- `open` のとき `status-badge--primary` クラスが付与されること
- `closed` のとき `status-badge--warning` クラスが付与されること
- `disbanded` のとき `status-badge--error` クラスが付与されること
