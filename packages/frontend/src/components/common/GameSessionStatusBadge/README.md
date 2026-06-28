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

| ステータス   | ラベル     | バリアント          |
| ------------ | ---------- | ------------------- |
| `draft`      | 非公開     | muted（グレー）     |
| `open`       | 募集中     | primary（ティール） |
| `scheduling` | 日程調整中 | warning（オレンジ） |
| `confirmed`  | 実施前     | success（グリーン） |
| `today`      | 当日       | error（レッド）     |
| `completed`  | 通過済み   | muted（グレー）     |

`today` にのみ error（赤）を使い、当日開催の緊急感を他ステータスと区別する。  
バリアントのマッピングは `features/GameSession/Detail/StatusDisplay.vue` の設計方針に準拠している。

## Design Notes

- CSS変数 `--color-*` を使用し、ライト/ダーク両テーマに対応
- `color-mix()` でソフトな背景色を生成（15% の割合）
- `--radius-full` による pill 形状（`BaseBadge` と同一）
- `Base` プレフィックスなし：ドメイン知識（`GameSessionStatus` enum）を持つため汎用 UI プリミティブではない

## 単体テスト項目

### レンダリング

- `status` props を渡してレンダリングされること

### ラベル

- `draft` のとき「非公開」と表示されること
- `open` のとき「募集中」と表示されること
- `scheduling` のとき「日程調整中」と表示されること
- `confirmed` のとき「実施前」と表示されること
- `today` のとき「当日」と表示されること
- `completed` のとき「通過済み」と表示されること

### バリアント

- `draft` のとき `status-badge--muted` クラスが付与されること
- `open` のとき `status-badge--primary` クラスが付与されること
- `scheduling` のとき `status-badge--warning` クラスが付与されること
- `confirmed` のとき `status-badge--success` クラスが付与されること
- `today` のとき `status-badge--error` クラスが付与されること
- `completed` のとき `status-badge--muted` クラスが付与されること
