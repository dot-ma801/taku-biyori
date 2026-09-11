# GameSessionStatusBadge

`GameSessionStatus` を受け取り、ステータスに対応したラベルと色のバッジを表示するコンポーネント。

ドメイン知識（`GameSessionStatus` の enum）を持つが、複数の feature から共通で利用されるため `components/common/` に配置している。  
API 呼び出しや composable 依存は一切持たず、純粋な表示のみを担当する。

## Props

| Prop     | Type                | Description                          |
| -------- | ------------------- | ------------------------------------ |
| `status` | `GameSessionStatus` | 表示するゲームセッションのステータス |

## Usage

```vue
<GameSessionStatusBadge :status="gameSession.status" />
```

## ステータスとバリアントの対応

ラベルは design-v2 §4-2 の「日本語」列に揃えている。

| ステータス  | ラベル   | バリアント          |
| ----------- | -------- | ------------------- |
| `scheduled` | 開催予定 | success（グリーン） |
| `today`     | 本日開催 | error（レッド）     |
| `completed` | 完了     | muted（グレー）     |
| `cancelled` | 中止     | error（レッド）     |

`today` と `cancelled` に error（赤）を使う。`today` は当日開催の緊急感を、`cancelled` は開催されない事実を、それぞれ他ステータスと区別して伝える。  
バリアントのマッピングは `features/GameSession/Detail/StatusDisplay.vue` の設計方針に準拠している。

公開と受付はロビーの関心事なので、開催のステータスには含まれない（design-v2 §4-2）。
ロビーのバッジは `LobbyStatusBadge` を使うこと。

## Design Notes

- CSS変数 `--color-*` を使用し、ライト/ダーク両テーマに対応
- `color-mix()` でソフトな背景色を生成（15% の割合）
- `--radius-full` による pill 形状（`BaseBadge` と同一）
- `Base` プレフィックスなし：ドメイン知識（`GameSessionStatus` enum）を持つため汎用 UI プリミティブではない

## 単体テスト項目

### レンダリング

- `status` props を渡してレンダリングされること

### ラベル

- `scheduled` のとき「開催予定」と表示されること
- `today` のとき「本日開催」と表示されること
- `completed` のとき「完了」と表示されること
- `cancelled` のとき「中止」と表示されること

### バリアント

- `scheduled` のとき `status-badge--success` クラスが付与されること
- `today` のとき `status-badge--error` クラスが付与されること
- `completed` のとき `status-badge--muted` クラスが付与されること
- `cancelled` のとき `status-badge--error` クラスが付与されること
