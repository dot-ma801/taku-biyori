# LobbyStatusBadge

`LobbyStatus` を受け取り、ステータスに対応したラベルと色のバッジを表示するコンポーネント。

ドメイン知識（`LobbyStatus` の enum）を持つが、複数の feature から共通で利用されるため `components/common/` に配置している。  
API 呼び出しや composable 依存は一切持たず、純粋な表示のみを担当する。

## Props

| Prop     | Type          | Description                |
| -------- | ------------- | -------------------------- |
| `status` | `LobbyStatus` | 表示する募集枠のステータス |

## Usage

```vue
<LobbyStatusBadge :status="lobby.status" />
```

## ステータスとバリアントの対応

| ステータス  | ラベル   | バリアント          |
| ----------- | -------- | ------------------- |
| `draft`     | 非公開   | muted（グレー）     |
| `open`      | 募集中   | primary（ティール） |
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

- `draft` のとき「非公開」と表示されること
- `open` のとき「募集中」と表示されること
- `closed` のとき「受付終了」と表示されること
- `disbanded` のとき「解散」と表示されること

### バリアント

- `draft` のとき `status-badge--muted` クラスが付与されること
- `open` のとき `status-badge--primary` クラスが付与されること
- `closed` のとき `status-badge--warning` クラスが付与されること
- `disbanded` のとき `status-badge--error` クラスが付与されること
